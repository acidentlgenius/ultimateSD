// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { awardStepXp } from '../submissions';
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
    problemProgress: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/posthog', () => ({
  default: {
    capture: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('awardStepXp', () => {
  it('updates by id after finding by email insensitive', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-id', email: 'Test@example.com' } } as any);
    vi.mocked(prisma.problemProgress.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-id',
      xp: 10,
      level: 1,
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-id',
    } as any);

    await awardStepXp('problem', 'step');

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Test@example.com', mode: 'insensitive' } },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-id' },
    }));
  });
});
