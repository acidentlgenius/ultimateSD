import 'server-only';

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import { buildStageRails, type CoachStage } from '@/lib/adaptive-coach/tools/stage-rails';
import { retrieveGold } from '@/lib/adaptive-coach/rag/retrieve-gold';
import { progressGate } from '@/lib/adaptive-coach/tools/progress-gate';
import { runProfileReflect } from '@/lib/adaptive-coach/tools/schedule-profile-reflect';
import {
  invokeEvaluateForLevel,
  invokeMockProbe,
  invokeSessionDebrief,
  type SessionDebriefOutput,
} from '@/lib/adaptive-coach/skills/invoke';
import type { GateDecision, SessionState } from '@/lib/adaptive-coach/types';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getProblemBySlug } from '@/lib/problems';
import {
  canEndProbe,
  isFinalProbeRound,
  isValidProbeRound,
  PROBE_MAX_ROUNDS,
  PROBE_MIN_ROUNDS,
} from '@/lib/probe';
import { getUserLLM } from '@/lib/user-llm';
import type { SystemDesignProblem } from '@/types';

import {
  resolveClassicStageId,
  type ClassicEvaluateFeedback,
  type ClassicEvaluateInput,
  type ClassicEvaluateResult,
} from './classic';

export { PROBE_MIN_ROUNDS, PROBE_MAX_ROUNDS, canEndProbe, isFinalProbeRound, isValidProbeRound };

export type MockEvaluateInput = ClassicEvaluateInput & {
  variant?: 'lite' | 'full';
  sessionRemainingSec?: number;
};

export type InterviewDebriefInput = {
  llm: BaseChatModel;
  userId: string;
  problem: SystemDesignProblem;
  answers: InterviewAnswerTranscript[];
  variant?: 'lite' | 'full';
};

export type InterviewAnswerTranscript = {
  phase: string;
  title: string;
  answer: string;
  passed: boolean;
};

export type MockProbeInput = {
  llm: BaseChatModel;
  userId: string;
  problemSlug: string;
  difficulty: SystemDesignProblem['difficulty'];
  variant?: 'lite' | 'full';
  stageId: string;
  userAnswer: string;
  round: number;
  probeHistory?: string[];
};

export type MockProbeResult = {
  question: string;
  round: number;
  isFinalRound: boolean;
  canEnd: boolean;
};

function findStage(rails: CoachStage[], stageId: string): CoachStage {
  const stage = rails.find((rail) => rail.id === stageId);
  if (!stage) {
    throw new Error(`Unknown stage: ${stageId}`);
  }
  return stage;
}

function resolveMockStageId(input: MockEvaluateInput): string {
  if (input.stageId) {
    return input.stageId;
  }
  if (!input.phaseKey || !input.subStep) {
    throw new Error('stageId or phaseKey+subStep required for mock evaluate');
  }
  return resolveClassicStageId(
    input.problemSlug,
    input.phaseKey,
    input.subStep,
    input.difficulty,
  );
}

export async function evaluateMockAnswer(
  input: MockEvaluateInput,
): Promise<ClassicEvaluateResult> {
  const profile = await loadProfile(input.userId);
  const rails = buildStageRails(
    input.problemSlug,
    input.difficulty,
    profile.level,
    'mock',
    input.variant ?? 'lite',
  );
  const stageId = resolveMockStageId(input);
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
  });

  const gate = progressGate({
    mode: 'mock',
    level: profile.level,
    score: evaluation.score,
    attempts: input.attemptCount,
    stageElapsedSec: input.stageElapsedSec ?? 0,
    stageBudgetSec: stage.budgetSec,
    sessionRemainingSec: input.sessionRemainingSec ?? Number.POSITIVE_INFINITY,
  });

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
  };
}

export async function generateMockProbe(
  input: MockProbeInput,
): Promise<MockProbeResult> {
  if (!isValidProbeRound(input.round)) {
    throw new Error(`Invalid probe round: ${input.round}`);
  }

  const profile = await loadProfile(input.userId);
  const rails = buildStageRails(
    input.problemSlug,
    input.difficulty,
    profile.level,
    'mock',
    input.variant ?? 'lite',
  );
  const stage = findStage(rails, input.stageId);
  const problemTitle = getProblemBySlug(input.problemSlug)?.title ?? input.problemSlug;

  const gold = retrieveGold({
    problemSlug: input.problemSlug,
    stageId: stage.id,
    skillFocus: [],
  }).chunks;

  const output = await invokeMockProbe({
    llm: input.llm,
    profile,
    problemTitle,
    stage,
    userAnswer: input.userAnswer,
    gold,
    round: input.round,
    probeHistory: input.probeHistory ?? [],
  });

  return {
    question: output.question,
    round: input.round,
    isFinalRound: isFinalProbeRound(input.round),
    canEnd: canEndProbe(input.round),
  };
}

export async function generateInterviewDebrief(
  input: InterviewDebriefInput,
): Promise<SessionDebriefOutput | null> {
  const profile = await loadProfile(input.userId);

  return invokeSessionDebrief({
    llm: input.llm,
    profile,
    problemTitle: input.problem.title,
    problemSlug: input.problem.slug,
    mode: 'mock',
    answers: input.answers,
    variant: input.variant ?? 'lite',
  });
}

export function scheduleInterviewCoachFinish(args: {
  userId: string;
  problemSlug: string;
  finalScore?: number;
  variant?: 'lite' | 'full';
}): void {
  void (async () => {
    try {
      if (!(await canAccessFeature(args.userId, 'adaptiveCoach'))) {
        return;
      }

      const [profile, { llm }] = await Promise.all([
        loadProfile(args.userId),
        getUserLLM(args.userId, {
          temperature: 0.3,
          problemSlug: args.problemSlug,
        }),
      ]);

      const sessionState: SessionState = {
        version: 'adaptive-1',
        mode: 'mock',
        problemSlug: args.problemSlug,
        stageId: 'complete',
        agenda: [],
        attempts: {},
        stageStartedAt: new Date().toISOString(),
        sessionBudgetSec: 0,
        status: 'complete',
      };

      await runProfileReflect({
        userId: args.userId,
        problemSlug: args.problemSlug,
        mode: 'mock',
        sessionState,
        profile,
        llm,
        finalScore: args.finalScore,
      });
    } catch (err) {
      console.error('[profile-reflect] interview session failed:', err);
    }
  })();
}

export type { ClassicEvaluateFeedback, GateDecision };
