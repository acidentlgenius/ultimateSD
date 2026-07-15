// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/adaptive-coach/tools/load-profile', () => ({
  loadProfile: vi.fn(),
}));
vi.mock('@/lib/adaptive-coach/skills/invoke', () => ({
  invokeEvaluateForLevel: vi.fn(),
  invokeTeachForward: vi.fn(),
}));
vi.mock('@/lib/adaptive-coach/tools/record-outcome', () => ({
  recordOutcome: vi.fn(),
}));

import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import {
  invokeEvaluateForLevel,
  invokeTeachForward,
} from '@/lib/adaptive-coach/skills/invoke';
import { recordOutcome } from '@/lib/adaptive-coach/tools/record-outcome';
import {
  evaluateClassicAnswer,
  resolveClassicStageId,
  resolveOutcomeSkillIds,
} from '@/lib/adaptive-coach/adapters/classic';

const mockedLoadProfile = vi.mocked(loadProfile);
const mockedEvaluate = vi.mocked(invokeEvaluateForLevel);
const mockedTeach = vi.mocked(invokeTeachForward);
const mockedRecordOutcome = vi.mocked(recordOutcome);

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
  mockedRecordOutcome.mockResolvedValue(undefined);
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

describe('resolveOutcomeSkillIds', () => {
  it('prefers tip skillFocus over stage phaseKey', () => {
    expect(
      resolveOutcomeSkillIds(
        { phaseKey: 'requirements' } as never,
        ['api-design'],
      ),
    ).toEqual(['api-design']);
  });

  it('falls back to stage phaseKey then requirements', () => {
    expect(
      resolveOutcomeSkillIds({ phaseKey: 'requirements' } as never),
    ).toEqual(['requirements']);
    expect(resolveOutcomeSkillIds({ phaseKey: '' } as never)).toEqual([
      'requirements',
    ]);
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
    expect(mockedRecordOutcome).toHaveBeenCalledWith({
      userId: 'u1',
      skillIds: ['requirements'],
      outcome: 'earned',
    });
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
    expect(mockedRecordOutcome).toHaveBeenCalledWith({
      userId: 'u1',
      skillIds: ['api-design'],
      outcome: 'coached',
    });
  });

  it('records coached outcome on advance_budget', async () => {
    const result = await evaluateClassicAnswer({
      userId: 'u1',
      llm: {} as never,
      problemSlug: 'design-tinyurl',
      difficulty: 'Easy',
      stageId: 'requirements-0',
      userAnswer: 'Just shorten links',
      attemptCount: 1,
      stageElapsedSec: 601,
    });

    expect(result.gate.action).toBe('advance_budget');
    expect(result.feedback.isAcceptable).toBe(false);
    expect(mockedTeach).not.toHaveBeenCalled();
    expect(mockedRecordOutcome).toHaveBeenCalledWith({
      userId: 'u1',
      skillIds: ['requirements'],
      outcome: 'coached',
    });
  });
});
