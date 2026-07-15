import 'server-only';

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { buildStepKey } from '@/lib/step-journey';
import { getProblemBySlug } from '@/lib/problems';
import { getPracticeSteps } from '@/lib/interview-lite-steps';
import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import { buildStageRails, type CoachStage } from '@/lib/adaptive-coach/tools/stage-rails';
import { retrieveGold } from '@/lib/adaptive-coach/rag/retrieve-gold';
import { progressGate } from '@/lib/adaptive-coach/tools/progress-gate';
import {
  invokeEvaluateForLevel,
  invokeTeachForward,
} from '@/lib/adaptive-coach/skills/invoke';
import { recordOutcome } from '@/lib/adaptive-coach/tools/record-outcome';
import type { GateDecision } from '@/lib/adaptive-coach/types';
import type { SystemDesignProblem } from '@/types';

export type ClassicEvaluateInput = {
  userId: string;
  llm: BaseChatModel;
  problemSlug: string;
  difficulty: SystemDesignProblem['difficulty'];
  userAnswer: string;
  attemptCount: number;
  stageId?: string;
  phaseKey?: string;
  subStep?: string;
  stageElapsedSec?: number;
  previousFeedback?: {
    weaknesses: string[];
    missed: string[];
  };
};

export type ClassicEvaluateFeedback = {
  score: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  missed: string[];
  isAcceptable: boolean;
};

export type ClassicEvaluateResult = {
  feedback: ClassicEvaluateFeedback;
  gate: GateDecision;
  tip?: string;
};

function findStage(rails: CoachStage[], stageId: string): CoachStage {
  const stage = rails.find((rail) => rail.id === stageId);
  if (!stage) {
    throw new Error(`Unknown stage: ${stageId}`);
  }
  return stage;
}

export function resolveClassicStageId(
  problemSlug: string,
  phaseKey: string,
  subStep: string,
  difficulty: SystemDesignProblem['difficulty'],
): string {
  const { steps } = getPracticeSteps(problemSlug, difficulty);
  const phaseSteps = steps[phaseKey];
  if (!phaseSteps) {
    throw new Error(`Unknown phase "${phaseKey}" for problem "${problemSlug}"`);
  }

  const index = phaseSteps.findIndex((step) => step.subStep === subStep);
  if (index < 0) {
    throw new Error(
      `Unknown subStep "${subStep}" in phase "${phaseKey}" for problem "${problemSlug}"`,
    );
  }

  return buildStepKey(phaseKey, index);
}

function resolveStageId(input: ClassicEvaluateInput): string {
  if (input.stageId) {
    return input.stageId;
  }
  if (!input.phaseKey || !input.subStep) {
    throw new Error('stageId or phaseKey+subStep required for classic evaluate');
  }
  return resolveClassicStageId(
    input.problemSlug,
    input.phaseKey,
    input.subStep,
    input.difficulty,
  );
}

export function resolveOutcomeSkillIds(
  stage: CoachStage,
  tipSkillFocus?: string[],
): string[] {
  if (tipSkillFocus?.length) {
    return tipSkillFocus;
  }
  return stage.phaseKey ? [stage.phaseKey] : ['requirements'];
}

export async function evaluateClassicAnswer(
  input: ClassicEvaluateInput,
): Promise<ClassicEvaluateResult> {
  const profile = await loadProfile(input.userId);
  const rails = buildStageRails(
    input.problemSlug,
    input.difficulty,
    profile.level,
    'practice',
  );
  const stageId = resolveStageId(input);
  const stage = findStage(rails, stageId);
  const problemTitle = getProblemBySlug(input.problemSlug)?.title ?? input.problemSlug;

  const gold = retrieveGold({
    problemSlug: input.problemSlug,
    stageId: stage.id,
    skillFocus: [],
  }).chunks;

  const evaluation = await invokeEvaluateForLevel({
    llm: input.llm,
    profile,
    problemTitle,
    stage,
    userAnswer: input.userAnswer,
    gold,
    attemptCount: input.attemptCount,
    previousFeedback: input.previousFeedback,
  });

  const gate = progressGate({
    mode: 'practice',
    level: profile.level,
    score: evaluation.score,
    attempts: input.attemptCount,
    stageElapsedSec: input.stageElapsedSec ?? 0,
    stageBudgetSec: stage.budgetSec,
    sessionRemainingSec: Number.POSITIVE_INFINITY,
  });

  let tip: string | undefined;
  if (gate.action === 'pass') {
    await recordOutcome({
      userId: input.userId,
      skillIds: resolveOutcomeSkillIds(stage),
      outcome: 'earned',
    });
  } else if (gate.action === 'teach_forward') {
    const teachOutput = await invokeTeachForward({
      llm: input.llm,
      profile,
      problemTitle,
      stage,
      userAnswer: input.userAnswer,
      gold,
      gateReason: gate.reason,
    });
    tip = teachOutput.tip;
    await recordOutcome({
      userId: input.userId,
      skillIds: resolveOutcomeSkillIds(stage, teachOutput.skillFocus),
      outcome: 'coached',
    });
  } else if (gate.action === 'advance_budget') {
    await recordOutcome({
      userId: input.userId,
      skillIds: resolveOutcomeSkillIds(stage),
      outcome: 'coached',
    });
  }

  return {
    feedback: {
      score: evaluation.score,
      accuracy: evaluation.accuracy,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missed: evaluation.missed,
      isAcceptable: gate.action === 'pass',
    },
    gate,
    tip,
  };
}
