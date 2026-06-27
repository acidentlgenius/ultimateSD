// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    stepSubmission: { create: vi.fn() },
    problemProgress: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { recordStepSubmission } from '@/app/actions/progress/submissions';

describe('recordStepSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never);
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
});
