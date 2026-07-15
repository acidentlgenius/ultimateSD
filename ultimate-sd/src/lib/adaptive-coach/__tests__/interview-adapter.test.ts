// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/adaptive-coach/tools/load-profile', () => ({
  loadProfile: vi.fn(),
}));
vi.mock('@/lib/adaptive-coach/tools/record-outcome', () => ({
  recordOutcome: vi.fn(),
}));
vi.mock('@/lib/adaptive-coach/skills/invoke', () => ({
  invokeEvaluateForLevel: vi.fn(),
  invokeMockProbe: vi.fn(),
  invokeSessionDebrief: vi.fn(),
}));
vi.mock('@/lib/adaptive-coach/tools/schedule-profile-reflect', () => ({
  runProfileReflect: vi.fn(),
}));
vi.mock('@/lib/feature-flags-server', () => ({
  canAccessFeature: vi.fn(),
}));
vi.mock('@/lib/user-llm', () => ({
  getUserLLM: vi.fn(),
}));

import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import {
  invokeEvaluateForLevel,
  invokeMockProbe,
} from '@/lib/adaptive-coach/skills/invoke';
import { runProfileReflect } from '@/lib/adaptive-coach/tools/schedule-profile-reflect';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getUserLLM } from '@/lib/user-llm';
import {
  evaluateMockAnswer,
  generateMockProbe,
  PROBE_MAX_ROUNDS,
  PROBE_MIN_ROUNDS,
  scheduleInterviewCoachFinish,
} from '@/lib/adaptive-coach/adapters/interview';

const mockedLoadProfile = vi.mocked(loadProfile);
const mockedEvaluate = vi.mocked(invokeEvaluateForLevel);
const mockedProbe = vi.mocked(invokeMockProbe);
const mockedReflect = vi.mocked(runProfileReflect);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);

const PROFILE = {
  userId: 'u1',
  level: 'sde1' as const,
  companies: [],
  intent: 'interview' as const,
  competencies: [],
  memoryNotes: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedLoadProfile.mockResolvedValue(PROFILE);
  mockedEvaluate.mockResolvedValue({
    score: 4,
    accuracy: 50,
    strengths: [],
    weaknesses: ['thin'],
    missed: ['redirects'],
  });
  mockedProbe.mockResolvedValue({ question: 'What happens when the DB is down?' });
  mockedFlag.mockResolvedValue(true);
  mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
  mockedReflect.mockResolvedValue(undefined);
});

describe('probe round caps', () => {
  it('re-exports PROBE_MIN_ROUNDS and PROBE_MAX_ROUNDS from probe module', () => {
    expect(PROBE_MIN_ROUNDS).toBe(2);
    expect(PROBE_MAX_ROUNDS).toBe(3);
  });
});

describe('evaluateMockAnswer', () => {
  it('sets isAcceptable only when mock gate passes', async () => {
    mockedEvaluate.mockResolvedValue({
      score: 8,
      accuracy: 85,
      strengths: ['solid'],
      weaknesses: [],
      missed: [],
    });

    const result = await evaluateMockAnswer({
      userId: 'u1',
      llm: {} as never,
      problemSlug: 'design-tinyurl',
      difficulty: 'Easy',
      stageId: 'requirements-0',
      userAnswer: 'Create and redirect short URLs',
      attemptCount: 1,
      variant: 'lite',
    });

    expect(result.gate.action).toBe('pass');
    expect(result.feedback.isAcceptable).toBe(true);
  });

  it('returns end_mock when session timer is exhausted', async () => {
    const result = await evaluateMockAnswer({
      userId: 'u1',
      llm: {} as never,
      problemSlug: 'design-tinyurl',
      difficulty: 'Easy',
      stageId: 'requirements-0',
      userAnswer: 'Create and redirect short URLs',
      attemptCount: 1,
      variant: 'lite',
      sessionRemainingSec: 0,
    });

    expect(result.gate.action).toBe('end_mock');
    expect(result.feedback.isAcceptable).toBe(false);
  });
});

describe('generateMockProbe', () => {
  it('returns probe question with round metadata aligned to caps', async () => {
    const result = await generateMockProbe({
      userId: 'u1',
      llm: {} as never,
      problemSlug: 'design-tinyurl',
      difficulty: 'Easy',
      stageId: 'requirements-0',
      userAnswer: 'Shorten URLs',
      round: 2,
      variant: 'lite',
    });

    expect(result.question).toContain('DB');
    expect(result.round).toBe(2);
    expect(result.canEnd).toBe(true);
    expect(result.isFinalRound).toBe(false);
    expect(mockedProbe).toHaveBeenCalledWith(
      expect.objectContaining({ round: 2 }),
    );
  });

  it('marks round 3 as final', async () => {
    const result = await generateMockProbe({
      userId: 'u1',
      llm: {} as never,
      problemSlug: 'design-tinyurl',
      difficulty: 'Easy',
      stageId: 'requirements-0',
      userAnswer: 'Shorten URLs',
      round: PROBE_MAX_ROUNDS,
      variant: 'lite',
    });

    expect(result.isFinalRound).toBe(true);
  });
});

describe('scheduleInterviewCoachFinish', () => {
  it('runs profile-reflect when adaptiveCoach flag is on', async () => {
    scheduleInterviewCoachFinish({
      userId: 'u1',
      problemSlug: 'design-tinyurl',
      finalScore: 7,
      variant: 'lite',
    });

    await vi.waitFor(() => {
      expect(mockedReflect).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          problemSlug: 'design-tinyurl',
          mode: 'mock',
          finalScore: 7,
        }),
      );
    });
  });

  it('skips when adaptiveCoach flag is off', async () => {
    mockedFlag.mockResolvedValue(false);

    scheduleInterviewCoachFinish({
      userId: 'u1',
      problemSlug: 'design-tinyurl',
      finalScore: 7,
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockedReflect).not.toHaveBeenCalled();
  });
});
