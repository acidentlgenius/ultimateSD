// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/adaptive-coach/tools/load-profile', () => ({
  loadProfile: vi.fn(),
}));
vi.mock('@/lib/adaptive-coach/skills/invoke', () => ({
  invokeEvaluateForLevel: vi.fn(),
  invokeTeachForward: vi.fn(),
}));

import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import {
  invokeEvaluateForLevel,
  invokeTeachForward,
} from '@/lib/adaptive-coach/skills/invoke';
import {
  evaluateClassicAnswer,
  resolveClassicStageId,
} from '@/lib/adaptive-coach/adapters/classic';

const mockedLoadProfile = vi.mocked(loadProfile);
const mockedEvaluate = vi.mocked(invokeEvaluateForLevel);
const mockedTeach = vi.mocked(invokeTeachForward);

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
});

describe('resolveClassicStageId', () => {
  it('maps phaseKey and subStep to requirements-0 for TinyURL', () => {
    expect(
      resolveClassicStageId(
        'design-tinyurl',
        'requirements',
        'functional',
        'Easy',
      ),
    ).toBe('requirements-0');
  });
});

describe('evaluateClassicAnswer', () => {
  it('sets isAcceptable only when gate passes', async () => {
    mockedEvaluate.mockResolvedValue({
      score: 7,
      accuracy: 80,
      strengths: ['solid'],
      weaknesses: [],
      missed: [],
    });

    const result = await evaluateClassicAnswer({
      userId: 'u1',
      llm: {} as never,
      problemSlug: 'design-tinyurl',
      difficulty: 'Easy',
      stageId: 'requirements-0',
      userAnswer: 'Create and redirect short URLs',
      attemptCount: 1,
    });

    expect(result.gate.action).toBe('pass');
    expect(result.feedback.isAcceptable).toBe(true);
    expect(mockedTeach).not.toHaveBeenCalled();
  });

  it('returns teach_forward tip when attempts are exhausted', async () => {
    mockedTeach.mockResolvedValue({
      tip: 'Include read-heavy redirect path and write path for new codes.',
      skillFocus: ['api-design'],
    });

    const result = await evaluateClassicAnswer({
      userId: 'u1',
      llm: {} as never,
      problemSlug: 'design-tinyurl',
      difficulty: 'Easy',
      stageId: 'requirements-0',
      userAnswer: 'Just shorten links',
      attemptCount: 3,
    });

    expect(result.gate.action).toBe('teach_forward');
    expect(result.feedback.isAcceptable).toBe(false);
    expect(result.tip).toContain('redirect');
    expect(mockedTeach).toHaveBeenCalled();
  });
});
