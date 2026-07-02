import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    featureFlag: { findMany: vi.fn(), upsert: vi.fn() },
    featureFlagOverride: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  listFeatureFlags,
  setFeatureFlagPlans,
  setFeatureFlagOverride,
} from '@/app/actions/feature-flags';

const mockedAuth = vi.mocked(auth);
const mocked = vi.mocked(prisma, true);

function signInAs(role: string) {
  mockedAuth.mockResolvedValue({ user: { id: 'admin1' } } as never);
  mocked.user.findUnique.mockResolvedValue({ id: 'admin1', role } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin guard', () => {
  it('rejects non-admin users', async () => {
    signInAs('USER');
    await expect(setFeatureFlagPlans('aiProbe', ['ai'])).rejects.toThrow();
  });
});

describe('setFeatureFlagPlans', () => {
  it('upserts the flag row with the new plan set', async () => {
    signInAs('ADMIN');
    mocked.featureFlag.upsert.mockResolvedValue({} as never);
    await setFeatureFlagPlans('aiProbe', ['ai']);
    expect(mocked.featureFlag.upsert).toHaveBeenCalledWith({
      where: { key: 'aiProbe' },
      update: { enabledPlans: ['ai'] },
      create: { key: 'aiProbe', enabledPlans: ['ai'] },
    });
  });

  it('rejects unknown feature keys', async () => {
    signInAs('ADMIN');
    await expect(setFeatureFlagPlans('notAFlag' as never, [])).rejects.toThrow('Unknown feature');
  });
});

describe('setFeatureFlagOverride', () => {
  it('resolves the user by case-insensitive email and upserts', async () => {
    signInAs('ADMIN');
    mocked.user.findFirst.mockResolvedValue({ id: 'u9' } as never);
    mocked.featureFlagOverride.upsert.mockResolvedValue({} as never);
    await setFeatureFlagOverride('aiProbe', 'Test@Example.com', 'granted');
    expect(mocked.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Test@Example.com', mode: 'insensitive' } },
      select: { id: true },
    });
    expect(mocked.featureFlagOverride.upsert).toHaveBeenCalledWith({
      where: { flagKey_userId: { flagKey: 'aiProbe', userId: 'u9' } },
      update: { mode: 'granted' },
      create: { flagKey: 'aiProbe', userId: 'u9', mode: 'granted' },
    });
  });

  it('throws when the user does not exist', async () => {
    signInAs('ADMIN');
    mocked.user.findFirst.mockResolvedValue(null as never);
    await expect(
      setFeatureFlagOverride('aiProbe', 'ghost@example.com', 'granted')
    ).rejects.toThrow('User not found');
  });
});
