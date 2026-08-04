// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
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
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
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

  it('returns completed session without creating a new attempt', async () => {
    vi.mocked(prisma.problemProgress.findUnique).mockResolvedValue({
      activeSessionId: 'sess-done',
      activeSession: {
        id: 'sess-done',
        status: 'COMPLETED',
        startedAt: new Date('2026-01-01'),
        isTimerRunning: false,
        totalPausedSeconds: 0,
        lastPausedAt: null,
      },
    } as never);

    const result = await startPracticeSession('problem-1');

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe('sess-done');
    expect(result.isCompleted).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns a clear error when auth user id is missing from the database', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'ghost-id', email: 'ghost@example.com' },
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const result = await startPracticeSession('problem-1');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/sign out and sign in/i);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
