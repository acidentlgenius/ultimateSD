import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    featureFlag: { findUnique: vi.fn(), findMany: vi.fn() },
    featureFlagOverride: { findUnique: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { canAccessFeature, getFeatureFlagState } from '@/lib/feature-flags-server';

const mocked = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getFeatureFlagState', () => {
  it('returns the DB row when present', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'aiProbe', enabledPlans: ['ai'], updatedAt: new Date(),
    } as never);
    expect(await getFeatureFlagState('aiProbe')).toEqual(['ai']);
  });

  it('falls back to seed default (dark) when no row exists', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue(null as never);
    expect(await getFeatureFlagState('aiProbe')).toEqual([]);
  });
});

describe('canAccessFeature', () => {
  it('granted override lets a free user in while dark', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue(null as never);
    mocked.featureFlagOverride.findUnique.mockResolvedValue({
      id: '1', flagKey: 'aiProbe', userId: 'u1', mode: 'granted', createdAt: new Date(),
    } as never);
    mocked.user.findUnique.mockResolvedValue({
      planType: 'free', planExpiresAt: null,
    } as never);
    expect(await canAccessFeature('u1', 'aiProbe')).toBe(true);
  });

  it('plan launch grants access without an override', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'interviewMode', enabledPlans: ['platform', 'lifetime', 'ai'], updatedAt: new Date(),
    } as never);
    mocked.featureFlagOverride.findUnique.mockResolvedValue(null as never);
    mocked.user.findUnique.mockResolvedValue({
      planType: 'lifetime', planExpiresAt: null,
    } as never);
    expect(await canAccessFeature('u1', 'interviewMode')).toBe(true);
  });

  it('expired paid plan resolves as free', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'interviewMode', enabledPlans: ['platform'], updatedAt: new Date(),
    } as never);
    mocked.featureFlagOverride.findUnique.mockResolvedValue(null as never);
    mocked.user.findUnique.mockResolvedValue({
      planType: 'platform', planExpiresAt: new Date('2000-01-01'),
    } as never);
    expect(await canAccessFeature('u1', 'interviewMode')).toBe(false);
  });

  it('anonymous user is plan free with no override', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'fresherTrack', enabledPlans: ['free'], updatedAt: new Date(),
    } as never);
    expect(await canAccessFeature(null, 'fresherTrack')).toBe(true);
    expect(mocked.featureFlagOverride.findUnique).not.toHaveBeenCalled();
  });
});
