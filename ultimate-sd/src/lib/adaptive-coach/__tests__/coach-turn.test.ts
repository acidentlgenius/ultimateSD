// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    coachMemoryNote: { findMany: vi.fn() },
    competencySignal: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/adaptive-coach/tools/load-profile', () => ({
  loadProfile: vi.fn(),
  resolveExperienceLevel: vi.fn(),
}));

vi.mock('@/lib/adaptive-coach/skills/invoke', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/adaptive-coach/skills/invoke')>();
  return {
    ...actual,
    invokeEvaluateForLevel: vi.fn(),
    invokePlanAgenda: vi.fn(),
    invokeTeachForward: vi.fn(),
  };
});

vi.mock('@/lib/adaptive-coach/tools/record-outcome', () => ({
  recordOutcome: vi.fn(),
}));

vi.mock('@/lib/adaptive-coach/tools/schedule-profile-reflect', () => ({
  scheduleProfileReflect: vi.fn(),
}));

import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import {
  invokeEvaluateForLevel,
  invokePlanAgenda,
  invokeTeachForward,
} from '@/lib/adaptive-coach/skills/invoke';
import { recordOutcome } from '@/lib/adaptive-coach/tools/record-outcome';
import { scheduleProfileReflect } from '@/lib/adaptive-coach/tools/schedule-profile-reflect';
import { runCoachTurn } from '@/lib/adaptive-coach/graph/coach-supervisor';
import type { LearnerProfile, SessionState } from '@/lib/adaptive-coach/types';

const profile: LearnerProfile = {
  userId: 'user-1',
  level: 'sde1',
  companies: [],
  intent: 'interview',
  competencies: [],
  memoryNotes: [],
};

const lowScoreEvaluation = {
  score: 4,
  accuracy: 40,
  strengths: ['Mentioned entry flow'],
  weaknesses: ['Missing operator dashboard'],
  missed: ['Payment outage handling'],
};

const highScoreEvaluation = {
  score: 7,
  accuracy: 85,
  strengths: ['Complete feature list', 'Clear operator flows'],
  weaknesses: [],
  missed: [],
};

const teachTip = {
  tip: 'Call out how operators detect full lots without manual checks.',
  skillFocus: ['observability'],
};

const railAgenda = [
  {
    id: 'requirements-0-rail-0',
    kind: 'ask' as const,
    prompt: 'List the core features from entry to exit.',
    skillFocus: [],
    source: 'rail' as const,
  },
];

function mockLlm() {
  return { invoke: vi.fn() } as never;
}

describe('runCoachTurn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadProfile).mockResolvedValue(profile);
    vi.mocked(invokePlanAgenda).mockResolvedValue(railAgenda);
    vi.mocked(invokeEvaluateForLevel).mockResolvedValue(lowScoreEvaluation);
    vi.mocked(invokeTeachForward).mockResolvedValue(teachTip);
    vi.mocked(recordOutcome).mockResolvedValue(undefined);
  });

  it('starts a session with planned agenda', async () => {
    const llm = mockLlm();

    const response = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: { type: 'start' },
      sessionState: null,
      llm,
    });

    expect(response.sessionState.version).toBe('adaptive-1');
    expect(response.sessionState.stageId).toBe('requirements-0');
    expect(response.ui.agenda).toEqual(railAgenda);
    expect(response.ui.feedback).toBeUndefined();
    expect(loadProfile).toHaveBeenCalledWith('user-1');
    expect(invokePlanAgenda).toHaveBeenCalledOnce();
  });

  it('retries twice on low score then teach-forwards with tip when attempts exhausted', async () => {
    const llm = mockLlm();

    const start = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: { type: 'start' },
      sessionState: null,
      llm,
    });

    let session: SessionState = start.sessionState;

    const first = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: {
        type: 'submit',
        userAnswer: 'Users park and pay.',
        stageId: 'requirements-0',
      },
      sessionState: session,
      llm,
    });

    expect(first.ui.gate?.action).toBe('retry');
    expect(first.ui.feedback?.isAcceptable).toBe(false);
    expect(first.ui.feedback?.score).toBe(4);
    expect(first.ui.tip).toBeUndefined();
    expect(first.sessionState.attempts['requirements-0']).toBe(1);

    session = first.sessionState;

    const second = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: {
        type: 'submit',
        userAnswer: 'Still incomplete answer.',
        stageId: 'requirements-0',
      },
      sessionState: session,
      llm,
    });

    expect(second.ui.gate?.action).toBe('retry');
    expect(second.ui.feedback?.isAcceptable).toBe(false);
    expect(second.sessionState.attempts['requirements-0']).toBe(2);

    session = second.sessionState;

    const third = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: {
        type: 'submit',
        userAnswer: 'Third weak attempt.',
        stageId: 'requirements-0',
      },
      sessionState: session,
      llm,
    });

    expect(third.ui.gate?.action).toBe('teach_forward');
    expect(third.ui.feedback?.isAcceptable).toBe(false);
    expect(third.ui.tip).toBe(teachTip.tip);
    expect(third.sessionState.attempts['requirements-0']).toBe(3);
    expect(invokeTeachForward).toHaveBeenCalledOnce();
    expect(recordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        outcome: 'coached',
        skillIds: teachTip.skillFocus,
      }),
    );
    expect(invokeEvaluateForLevel).toHaveBeenCalledTimes(3);
  });

  it('passes on high score with isAcceptable true and records earned outcome', async () => {
    vi.mocked(invokeEvaluateForLevel).mockResolvedValue(highScoreEvaluation);
    const llm = mockLlm();

    const start = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: { type: 'start' },
      sessionState: null,
      llm,
    });

    const response = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: {
        type: 'submit',
        userAnswer: 'Complete requirements with entry, exit, payment, and operator dashboard.',
        stageId: 'requirements-0',
      },
      sessionState: start.sessionState,
      llm,
    });

    expect(response.ui.gate?.action).toBe('pass');
    expect(response.ui.feedback?.isAcceptable).toBe(true);
    expect(response.ui.feedback?.score).toBe(7);
    expect(recordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        outcome: 'earned',
        skillIds: railAgenda[0].skillFocus,
      }),
    );
    expect(invokeTeachForward).not.toHaveBeenCalled();
  });

  it('throws on submit stageId mismatch', async () => {
    const llm = mockLlm();

    const start = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: { type: 'start' },
      sessionState: null,
      llm,
    });

    await expect(
      runCoachTurn({
        userId: 'user-1',
        problemSlug: 'design-parking-lot',
        difficulty: 'Medium',
        mode: 'practice',
        event: {
          type: 'submit',
          userAnswer: 'Answer for wrong stage.',
          stageId: 'hld-0',
        },
        sessionState: start.sessionState,
        llm,
      }),
    ).rejects.toThrow(/submit stageId mismatch/);
  });

  it('ends mock session on timer exhaustion without retry replan', async () => {
    vi.mocked(invokeEvaluateForLevel).mockResolvedValue(highScoreEvaluation);
    const llm = mockLlm();

    const start = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'mock',
      event: { type: 'start' },
      sessionState: null,
      llm,
    });

    const response = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'mock',
      event: {
        type: 'submit',
        userAnswer: 'Strong answer but time is up.',
        stageId: 'requirements-0',
      },
      sessionState: {
        ...start.sessionState,
        stageStartedAt: new Date(Date.now() - 700_000).toISOString(),
      },
      llm,
    });

    expect(response.ui.gate?.action).toBe('end_mock');
    expect(response.sessionState.status).toBe('complete');
    expect(recordOutcome).not.toHaveBeenCalled();
    expect(invokePlanAgenda).toHaveBeenCalledOnce();
  });

  it('schedules profile-reflect on finish event', async () => {
    const llm = mockLlm();

    const start = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: { type: 'start' },
      sessionState: null,
      llm,
    });

    const response = await runCoachTurn({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      difficulty: 'Medium',
      mode: 'practice',
      event: { type: 'finish' },
      sessionState: start.sessionState,
      llm,
    });

    expect(response.sessionState.status).toBe('complete');
    expect(scheduleProfileReflect).toHaveBeenCalledOnce();
    expect(scheduleProfileReflect).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        problemSlug: 'design-parking-lot',
        mode: 'practice',
        profile,
        llm,
      }),
    );
  });
});
