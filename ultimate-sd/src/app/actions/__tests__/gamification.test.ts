// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { updateProgress, updateStreak } from '../gamification';
import { prisma } from '@/lib/prisma';
import { calculateLevel, calculateStreak } from '@/lib/gamification-logic';
import { auth } from '@/auth';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateProgress', () => {
  it('updates by id after finding by email insensitive', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'Test@example.com' } } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-id',
      xp: 10,
      level: 1,
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-id',
      xp: 30,
      level: 1,
    } as any);

    await updateProgress(20);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Test@example.com', mode: 'insensitive' } },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-id' },
    }));
  });
});

describe('updateStreak', () => {
  it('updates by id after finding by email insensitive', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'Test@example.com' } } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-id',
      streak: 1,
      lastPracticeAt: new Date(),
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-id',
      streak: 2,
    } as any);

    await updateStreak();

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Test@example.com', mode: 'insensitive' } },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-id' },
    }));
  });
});
