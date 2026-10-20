// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    stepSubmission: { create: vi.fn() },
    problemProgress: { findUnique: vi.fn(), upsert: vi.fn() },
    user: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { recordStepSubmission, completeStep } from '@/app/actions/progress/submissions';

describe('recordStepSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', email: 'test@example.com' } } as never);
  });

  it('skips empty content submissions', async () => {
    const result = await recordStepSubmission({
      sessionId: 's1',
      problemId: 'p1',
      stepId: 'requirements-0',
      phase: 'requirements',
      content: '   ',
      feedback: null,
      score: 0,
      isPassing: false,
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('updates user xp and level using user id', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'u1', email: 'test@example.com', xp: 100, level: 2, streak: 1, lastPracticeAt: new Date(Date.now() - 86400000) } as never);

    // Mock the transaction block execution
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return [];
    });

    vi.mocked(prisma.problemProgress.findUnique).mockResolvedValue({
      activeSessionId: 's1',
      completedStepIds: [],
    } as never);

    const result = await completeStep('p1', 'requirements-0', {
      content: 'valid content',
      feedback: 'good',
      score: 10,
      isPassing: true,
    });

    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u1' },
      data: expect.objectContaining({
        xp: expect.any(Number),
        level: expect.any(Number),
      })
    }));
  });
});
