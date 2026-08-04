// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    problemProgress: { findMany: vi.fn() },
  },
}));
vi.mock('@/lib/session-user', () => ({
  resolveSessionUserId: vi.fn(async (user: { id?: string | null }) => user.id ?? null),
  SESSION_STALE_MESSAGE: 'stale',
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { resolveSessionUserId } from '@/lib/session-user';
import { getUserRecommendations } from '@/app/actions/recommendations';

describe('getUserRecommendations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.problemProgress.findMany).mockResolvedValue([]);
  });

  it('resolves stale session ids before loading prefs and returns a daily pick', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'stale-id', email: 'e2e@test.local' },
    } as never);
    vi.mocked(resolveSessionUserId).mockResolvedValue('real-user-id');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      targetCompanies: ['Google'],
      preferredDifficulty: ['Medium'],
      focusAreas: ['System Design'],
    } as never);

    const result = await getUserRecommendations();

    expect(resolveSessionUserId).toHaveBeenCalledWith({
      id: 'stale-id',
      email: 'e2e@test.local',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'real-user-id' },
      select: {
        targetCompanies: true,
        preferredDifficulty: true,
        focusAreas: true,
      },
    });
    expect(prisma.problemProgress.findMany).toHaveBeenCalledWith({
      where: { userId: 'real-user-id' },
    });
    expect(result.dailyPick).not.toBeNull();
    expect(result.recommended.length).toBeGreaterThan(0);
  });

  it('returns empty recommendations when the session user cannot be resolved', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'gone', email: 'gone@test.local' },
    } as never);
    vi.mocked(resolveSessionUserId).mockResolvedValue(null);

    const result = await getUserRecommendations();

    expect(result).toEqual({
      dailyPick: null,
      needsReview: [],
      recommended: [],
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
