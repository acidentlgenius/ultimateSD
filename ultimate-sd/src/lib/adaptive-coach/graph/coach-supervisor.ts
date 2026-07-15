import 'server-only';

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type { z } from 'zod';

import { retrieveGold } from '@/lib/adaptive-coach/rag/retrieve-gold';
import {
  EvaluateSkillOutputSchema,
  type EvaluateSkillOutput,
  invokeEvaluateForLevel,
  invokePlanAgenda,
  invokeTeachForward,
} from '@/lib/adaptive-coach/skills/invoke';
import { resolveOutcomeSkillIds } from '@/lib/adaptive-coach/adapters/classic';
import { budgetTick } from '@/lib/adaptive-coach/tools/budget-tick';
import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import { progressGate } from '@/lib/adaptive-coach/tools/progress-gate';
import { recordOutcome } from '@/lib/adaptive-coach/tools/record-outcome';
import { scheduleProfileReflect } from '@/lib/adaptive-coach/tools/schedule-profile-reflect';
import {
  buildStageRails,
  type CoachStage,
} from '@/lib/adaptive-coach/tools/stage-rails';
import type {
  AgendaMove,
  GateDecision,
  LearnerProfile,
  PracticeMode,
  SessionState,
} from '@/lib/adaptive-coach/types';
import { getProblemBySlug } from '@/lib/problems';

const DEFAULT_SESSION_BUDGET_SEC = 45 * 60;

export type CoachTurnEvent =
  | { type: 'start' }
  | { type: 'submit'; userAnswer: string; stageId: string }
  | { type: 'tick'; sessionRemainingSec: number }
  | { type: 'finish' };

export type CoachTurnRequest = {
  userId: string;
  problemSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mode: PracticeMode;
  variant?: 'lite' | 'full';
  event: CoachTurnEvent;
  sessionState: SessionState | null;
  llm: BaseChatModel;
};

export type CoachTurnResponse = {
  sessionState: SessionState;
  ui: {
    agenda: AgendaMove[];
    feedback?: z.infer<typeof EvaluateSkillOutputSchema> & { isAcceptable: boolean };
    gate?: GateDecision;
    tip?: string;
  };
};

type SupervisorState = {
  request: CoachTurnRequest;
  profile: LearnerProfile | null;
  rails: CoachStage[];
  sessionState: SessionState | null;
  evaluation: EvaluateSkillOutput | null;
  gate: GateDecision | null;
  tip: string | undefined;
  coachedSkillIds: string[];
  agenda: AgendaMove[];
  sessionRemainingSec: number | null;
};

const CoachSupervisorAnnotation = Annotation.Root({
  request: Annotation<CoachTurnRequest>(),
  profile: Annotation<LearnerProfile | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  rails: Annotation<CoachStage[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  sessionState: Annotation<SessionState | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  evaluation: Annotation<EvaluateSkillOutput | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  gate: Annotation<GateDecision | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  tip: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  coachedSkillIds: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  agenda: Annotation<AgendaMove[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  sessionRemainingSec: Annotation<number | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

function problemTitle(slug: string): string {
  return getProblemBySlug(slug)?.title ?? slug;
}

function stageElapsedSec(stageStartedAt: string): number {
  const started = new Date(stageStartedAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - started) / 1000));
}

function findStage(rails: CoachStage[], stageId: string): CoachStage {
  const stage = rails.find((rail) => rail.id === stageId);
  if (!stage) {
    throw new Error(`Unknown stage: ${stageId}`);
  }
  return stage;
}

function nextStageId(rails: CoachStage[], currentStageId: string): string | null {
  const index = rails.findIndex((rail) => rail.id === currentStageId);
  if (index < 0 || index >= rails.length - 1) {
    return null;
  }
  return rails[index + 1].id;
}

function expectedSubmitStageId(
  sessionState: SessionState,
  rails: CoachStage[],
): string {
  return sessionState.stageId ?? rails[0]?.id ?? '';
}

function assertSubmitStageId(
  eventStageId: string,
  sessionState: SessionState,
  rails: CoachStage[],
): void {
  const expected = expectedSubmitStageId(sessionState, rails);
  if (eventStageId !== expected) {
    throw new Error(
      `submit stageId mismatch: expected "${expected}", got "${eventStageId}"`,
    );
  }
}

async function planForStage(
  request: CoachTurnRequest,
  profile: LearnerProfile,
  stage: CoachStage,
  lastEvaluation?: EvaluateSkillOutput,
): Promise<AgendaMove[]> {
  const gold = retrieveGold({
    problemSlug: request.problemSlug,
    stageId: stage.id,
    skillFocus: [],
  }).chunks;

  return invokePlanAgenda({
    llm: request.llm,
    profile,
    problemTitle: problemTitle(request.problemSlug),
    stage,
    gold,
    lastEvaluation,
  });
}

async function hydrateNode(
  state: SupervisorState,
): Promise<Partial<SupervisorState>> {
  const { request } = state;
  const profile = await loadProfile(request.userId);
  const rails = buildStageRails(
    request.problemSlug,
    request.difficulty,
    profile.level,
    request.mode,
    request.variant,
  );

  const sessionRemainingSec =
    request.event.type === 'tick'
      ? request.event.sessionRemainingSec
      : request.sessionState?.sessionBudgetSec ?? DEFAULT_SESSION_BUDGET_SEC;

  return { profile, rails, sessionRemainingSec };
}

async function planNode(state: SupervisorState): Promise<Partial<SupervisorState>> {
  const { request, profile, rails } = state;
  if (!profile || rails.length === 0) {
    throw new Error('hydrate must run before plan');
  }

  const firstStage = rails[0];
  const agenda = await planForStage(request, profile, firstStage);
  const sessionState: SessionState = {
    version: 'adaptive-1',
    mode: request.mode,
    problemSlug: request.problemSlug,
    stageId: firstStage.id,
    agenda,
    attempts: {},
    stageStartedAt: new Date().toISOString(),
    sessionBudgetSec: DEFAULT_SESSION_BUDGET_SEC,
    status: 'running',
  };

  return { agenda, sessionState };
}

async function evaluateNode(
  state: SupervisorState,
): Promise<Partial<SupervisorState>> {
  const { request, profile, rails, sessionState } = state;
  if (!profile || !sessionState) {
    throw new Error('hydrate must run before evaluate');
  }
  if (request.event.type !== 'submit') {
    throw new Error('evaluate node requires submit event');
  }

  assertSubmitStageId(request.event.stageId, sessionState, rails);

  const stage = findStage(rails, request.event.stageId);
  const gold = retrieveGold({
    problemSlug: request.problemSlug,
    stageId: stage.id,
    skillFocus: [],
  }).chunks;

  const evaluation = await invokeEvaluateForLevel({
    llm: request.llm,
    profile,
    problemTitle: problemTitle(request.problemSlug),
    stage,
    userAnswer: request.event.userAnswer,
    gold,
  });

  return { evaluation };
}

async function gateNode(state: SupervisorState): Promise<Partial<SupervisorState>> {
  const { request, profile, rails, sessionState, evaluation } = state;
  if (!profile || !sessionState || !evaluation) {
    throw new Error('evaluate must run before gate');
  }
  if (request.event.type !== 'submit') {
    throw new Error('gate node requires submit event');
  }

  const stage = findStage(rails, request.event.stageId);
  const stageId = request.event.stageId;
  const attempts = (sessionState.attempts[stageId] ?? 0) + 1;
  const gate = progressGate({
    mode: request.mode,
    level: profile.level,
    score: evaluation.score,
    attempts,
    stageElapsedSec: stageElapsedSec(sessionState.stageStartedAt),
    stageBudgetSec: stage.budgetSec,
    sessionRemainingSec: state.sessionRemainingSec ?? sessionState.sessionBudgetSec,
  });

  const updatedAttempts = { ...sessionState.attempts, [stageId]: attempts };

  return {
    gate,
    sessionState: {
      ...sessionState,
      attempts: updatedAttempts,
    },
  };
}

async function teachNode(state: SupervisorState): Promise<Partial<SupervisorState>> {
  const { request, profile, rails, sessionState, gate } = state;
  if (!profile || !sessionState || !gate) {
    throw new Error('gate must run before teach');
  }
  if (request.event.type !== 'submit') {
    throw new Error('teach node requires submit event');
  }

  const stage = findStage(rails, request.event.stageId);
  const gold = retrieveGold({
    problemSlug: request.problemSlug,
    stageId: stage.id,
    skillFocus: [],
  }).chunks;

  const teachOutput = await invokeTeachForward({
    llm: request.llm,
    profile,
    problemTitle: problemTitle(request.problemSlug),
    stage,
    userAnswer: request.event.userAnswer,
    gold,
    gateReason: gate.reason,
  });

  return {
    tip: teachOutput.tip,
    coachedSkillIds: teachOutput.skillFocus,
  };
}

function maybeScheduleProfileReflect(
  prevStatus: SessionState['status'],
  nextSession: SessionState,
  request: CoachTurnRequest,
  profile: LearnerProfile,
): void {
  if (prevStatus !== 'running' || nextSession.status !== 'complete') {
    return;
  }

  scheduleProfileReflect({
    userId: request.userId,
    problemSlug: request.problemSlug,
    mode: request.mode,
    sessionState: nextSession,
    profile,
    llm: request.llm,
  });
}

async function persistNode(
  state: SupervisorState,
): Promise<Partial<SupervisorState>> {
  const { request, profile, rails, sessionState, evaluation, gate } = state;
  if (!profile || !sessionState) {
    throw new Error('hydrate must run before persist');
  }

  let nextSession = sessionState;
  let agenda = sessionState.agenda;
  const prevStatus = sessionState.status;

  if (request.event.type === 'tick') {
    const tick = budgetTick({
      mode: request.mode,
      sessionRemainingSec: request.event.sessionRemainingSec,
    });

    nextSession = {
      ...sessionState,
      sessionBudgetSec: request.event.sessionRemainingSec,
      status: tick.endMock ? 'complete' : sessionState.status,
    };

    maybeScheduleProfileReflect(prevStatus, nextSession, request, profile);
    return { sessionState: nextSession, agenda };
  }

  if (request.event.type === 'finish') {
    nextSession = { ...sessionState, status: 'complete' };
    maybeScheduleProfileReflect(prevStatus, nextSession, request, profile);
    return { sessionState: nextSession, agenda };
  }

  if (request.event.type === 'submit' && evaluation && gate) {
    const stageId = request.event.stageId;
    const stage = findStage(rails, stageId);

    if (gate.action === 'pass') {
      const focus = sessionState.agenda[0]?.skillFocus ?? [];
      await recordOutcome({
        userId: request.userId,
        skillIds: focus,
        outcome: 'earned',
      });

      const nextId = nextStageId(rails, stageId);
      if (nextId) {
        const nextStage = findStage(rails, nextId);
        agenda = await planForStage(request, profile, nextStage, evaluation);
        nextSession = {
          ...sessionState,
          stageId: nextId,
          agenda,
          stageStartedAt: new Date().toISOString(),
        };
      } else {
        nextSession = { ...sessionState, status: 'complete' };
      }
    } else if (gate.action === 'teach_forward') {
      await recordOutcome({
        userId: request.userId,
        skillIds: state.coachedSkillIds,
        outcome: 'coached',
      });

      const nextId = nextStageId(rails, stageId);
      if (nextId) {
        const nextStage = findStage(rails, nextId);
        agenda = await planForStage(request, profile, nextStage, evaluation);
        nextSession = {
          ...sessionState,
          stageId: nextId,
          agenda,
          stageStartedAt: new Date().toISOString(),
        };
      } else {
        nextSession = { ...sessionState, status: 'complete' };
      }
    } else if (gate.action === 'advance_budget') {
      await recordOutcome({
        userId: request.userId,
        skillIds: resolveOutcomeSkillIds(stage),
        outcome: 'coached',
      });

      const nextId = nextStageId(rails, stageId);
      if (nextId) {
        const nextStage = findStage(rails, nextId);
        agenda = await planForStage(request, profile, nextStage, evaluation);
        nextSession = {
          ...sessionState,
          stageId: nextId,
          agenda,
          stageStartedAt: new Date().toISOString(),
        };
      } else {
        nextSession = { ...sessionState, status: 'complete' };
      }
    } else if (gate.action === 'end_mock') {
      nextSession = { ...sessionState, status: 'complete' };
    } else {
      // retry — keep same stage; refresh agenda from planner with last evaluation
      agenda = await planForStage(request, profile, stage, evaluation);
      nextSession = { ...sessionState, agenda };
    }

    maybeScheduleProfileReflect(prevStatus, nextSession, request, profile);
    return { sessionState: nextSession, agenda };
  }

  return { sessionState: nextSession, agenda };
}

function routeAfterHydrate(state: SupervisorState): string {
  switch (state.request.event.type) {
    case 'start':
      return 'plan';
    case 'submit':
      return 'evaluate';
    case 'tick':
    case 'finish':
      return 'persist';
    default: {
      const _exhaustive: never = state.request.event;
      return _exhaustive;
    }
  }
}

function routeAfterGate(state: SupervisorState): string {
  if (state.gate?.action === 'teach_forward') {
    return 'teach';
  }
  return 'persist';
}

const coachSupervisorGraph = new StateGraph(CoachSupervisorAnnotation)
  .addNode('hydrate', hydrateNode)
  .addNode('plan', planNode)
  .addNode('evaluate', evaluateNode)
  .addNode('progressGate', gateNode)
  .addNode('teach', teachNode)
  .addNode('persist', persistNode)
  .addEdge(START, 'hydrate')
  .addConditionalEdges('hydrate', routeAfterHydrate, ['plan', 'evaluate', 'persist'])
  .addEdge('plan', 'persist')
  .addEdge('evaluate', 'progressGate')
  .addConditionalEdges('progressGate', routeAfterGate, ['teach', 'persist'])
  .addEdge('teach', 'persist')
  .addEdge('persist', END);

const compiledCoachSupervisor = coachSupervisorGraph.compile();

function toCoachTurnResponse(state: SupervisorState): CoachTurnResponse {
  if (!state.sessionState) {
    throw new Error('CoachSupervisor finished without sessionState');
  }

  const response: CoachTurnResponse = {
    sessionState: state.sessionState,
    ui: {
      agenda: state.agenda.length > 0 ? state.agenda : state.sessionState.agenda,
    },
  };

  if (state.evaluation && state.gate) {
    response.ui.feedback = {
      ...state.evaluation,
      isAcceptable: state.gate.action === 'pass',
    };
    response.ui.gate = state.gate;
  }

  if (state.tip) {
    response.ui.tip = state.tip;
  }

  return response;
}

export async function runCoachTurn(req: CoachTurnRequest): Promise<CoachTurnResponse> {
  const result = await compiledCoachSupervisor.invoke({
    request: req,
    profile: null,
    rails: [],
    sessionState: req.sessionState,
    evaluation: null,
    gate: null,
    tip: undefined,
    coachedSkillIds: [],
    agenda: req.sessionState?.agenda ?? [],
    sessionRemainingSec: null,
  });

  return toCoachTurnResponse(result as SupervisorState);
}
