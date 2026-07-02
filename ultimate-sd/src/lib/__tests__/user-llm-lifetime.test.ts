import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { update: vi.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { activateUserPlan } from '@/lib/user-llm';

const mocked = vi.mocked(prisma, true);

beforeEach(() => vi.clearAllMocks());

describe('activateUserPlan lifetime', () => {
  it('sets a never-expiring plan with zero platform credits', async () => {
    mocked.user.update.mockResolvedValue({} as never);
    await activateUserPlan('u1', 'lifetime');
    const data = mocked.user.update.mock.calls[0][0].data;
    expect(data.planType).toBe('lifetime');
    expect(data.planExpiresAt).toBeNull();
    expect(data.aiCredits).toBe(0);
    expect(data.aiCreditsResetAt).toBeNull();
  });

  it('keeps monthly expiry for platform', async () => {
    mocked.user.update.mockResolvedValue({} as never);
    await activateUserPlan('u1', 'platform');
    const data = mocked.user.update.mock.calls[0][0].data;
    expect(data.planExpiresAt).toBeInstanceOf(Date);
  });
});
