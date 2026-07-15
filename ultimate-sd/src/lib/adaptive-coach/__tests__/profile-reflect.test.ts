// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockCreateMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coachMemoryNote: {
      createMany: (...args: unknown[]) => mockCreateMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/lib/adaptive-coach/skills/invoke', () => ({
  invokeProfileReflect: vi.fn(),
}));

import { invokeProfileReflect } from '@/lib/adaptive-coach/skills/invoke';
import { runProfileReflect } from '@/lib/adaptive-coach/tools/schedule-profile-reflect';
import type { LearnerProfile, SessionState } from '@/lib/adaptive-coach/types';

const profile: LearnerProfile = {
  userId: 'user-1',
  level: 'sde1',
  companies: [],
  intent: 'interview',
  competencies: [],
  memoryNotes: [],
};

const sessionState: SessionState = {
  version: 'adaptive-1',
  mode: 'practice',
  problemSlug: 'design-parking-lot',
  stageId: 'requirements-0',
  agenda: [],
  attempts: { 'requirements-0': 2 },
  stageStartedAt: new Date().toISOString(),
  sessionBudgetSec: 1200,
  status: 'complete',
};

describe('runProfileReflect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMany.mockResolvedValue({ count: 1 });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        competencySignal: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });
  });

  it('writes memory notes and records competency deltas', async () => {
    vi.mocked(invokeProfileReflect).mockResolvedValue({
      notes: [
        {
          text: 'Struggled with operator visibility',
          tags: ['observability'],
          problemSlug: 'design-parking-lot',
        },
      ],
      competencyDeltas: [{ skillId: 'observability', outcome: 'coached' }],
    });

    await runProfileReflect({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      mode: 'practice',
      sessionState,
      profile,
      llm: { invoke: vi.fn() } as never,
      finalScore: 6,
    });

    expect(mockCreateMany).toHaveBeenCalledOnce();
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('skips persistence when profile-reflect returns empty output', async () => {
    vi.mocked(invokeProfileReflect).mockResolvedValue({
      notes: [],
      competencyDeltas: [],
    });

    await runProfileReflect({
      userId: 'user-1',
      problemSlug: 'design-parking-lot',
      mode: 'practice',
      sessionState,
      profile,
      llm: { invoke: vi.fn() } as never,
    });

    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
