// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    problemProgress: { findUnique: vi.fn(), upsert: vi.fn() },
    practiceSession: { create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startPracticeSession } from '@/app/actions/progress/sessions';

describe('startPracticeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
  });

  it('returns existing active session without creating a new one', async () => {
    vi.mocked(prisma.problemProgress.findUnique).mockResolvedValue({
      activeSessionId: 'sess-1',
      activeSession: {
        id: 'sess-1',
        status: 'ACTIVE',
        startedAt: new Date('2026-01-01'),
        isTimerRunning: true,
        totalPausedSeconds: 10,
        lastPausedAt: null,
      },
    } as never);

    const result = await startPracticeSession('problem-1');

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe('sess-1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
