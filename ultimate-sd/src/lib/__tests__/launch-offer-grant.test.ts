import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockTransaction = vi.fn();
const mockCount = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockSendPlanWelcomeEmail = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    launchOfferRedemption: {
      count: (...args: unknown[]) => mockCount(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  EmailConfigurationError: class EmailConfigurationError extends Error {
    name = 'EmailConfigurationError';
  },
  sendPlanWelcomeEmail: (...args: unknown[]) => mockSendPlanWelcomeEmail(...args),
}));

import {
  claimPlatformLaunchOffer,
  drawAiGiveawayWinners,
  grantAdminPlatformPlan,
} from '../launch-offer-grant';
import * as launchOffer from '../launch-offer';

vi.spyOn(launchOffer, 'isLaunchOfferActive').mockReturnValue(true);

describe('claimPlatformLaunchOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Pin time inside the launch offer's active window (ends 2026-07-15,
    // see LAUNCH_OFFER_CAMPAIGN_END_ISO) so these tests don't depend on
    // the real wall-clock date, which will otherwise drift past it.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    mockFindUnique.mockImplementation((args: { where?: { userId?: string }; select?: Record<string, boolean> }) => {
      if (args?.select?.planType !== undefined) {
        return Promise.resolve({ planType: 'free', planExpiresAt: null });
      }
      if (args?.select?.email !== undefined) {
        return Promise.resolve({ email: 'user@example.com', name: 'Alex' });
      }
      return Promise.resolve(null);
    });
    mockSendPlanWelcomeEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('grants platform plan when slots are available', async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        launchOfferRedemption: {
          findUnique: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(10),
          create: vi.fn().mockResolvedValue({}),
        },
        user: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const result = await claimPlatformLaunchOffer('user-1');

    expect(result).toEqual(
      expect.objectContaining({ success: true, emailSent: true })
    );
    expect(mockSendPlanWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        planType: 'platform',
        context: 'launch_platform_claim',
      })
    );
  });

  it('returns sold_out when cap is reached', async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        launchOfferRedemption: {
          findUnique: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(50),
        },
      };
      return fn(tx);
    });

    const result = await claimPlatformLaunchOffer('user-1');
    expect(result).toEqual({ error: 'sold_out' });
  });

  it('returns already_redeemed when user has a redemption', async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        launchOfferRedemption: {
          findUnique: vi.fn().mockResolvedValue({ id: 'r-1' }),
        },
      };
      return fn(tx);
    });

    const result = await claimPlatformLaunchOffer('user-1');
    expect(result).toEqual({ error: 'already_redeemed' });
  });

  it('returns has_paid_plan for active paid users', async () => {
    mockFindUnique.mockImplementation((args: { select?: Record<string, boolean> }) => {
      if (args?.select?.planType !== undefined) {
        return Promise.resolve({
          planType: 'platform',
          planExpiresAt: new Date('2099-01-01'),
        });
      }
      return Promise.resolve(null);
    });

    const result = await claimPlatformLaunchOffer('user-1');
    expect(result).toEqual({ error: 'has_paid_plan' });
  });
});

describe('grantAdminPlatformPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it('grants platform without consuming a launch slot', async () => {
    const result = await grantAdminPlatformPlan('user-1', 'admin-1', false);

    expect(result).toEqual(
      expect.objectContaining({ success: true, launchOfferSlotUsed: false })
    );
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ planType: 'platform' }),
      })
    );
  });

  it('creates redemption when consuming a launch slot', async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        launchOfferRedemption: {
          findUnique: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(10),
          create: mockCreate,
        },
        user: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const result = await grantAdminPlatformPlan('user-1', 'admin-1', true);

    expect(result).toEqual(
      expect.objectContaining({ success: true, launchOfferSlotUsed: true })
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          kind: 'PLATFORM_LAUNCH',
          grantedBy: 'admin-1',
        }),
      })
    );
  });

  it('returns sold_out when launch slots are full', async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        launchOfferRedemption: {
          findUnique: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(50),
        },
      };
      return fn(tx);
    });

    const result = await grantAdminPlatformPlan('user-1', 'admin-1', true);
    expect(result).toEqual({ error: 'sold_out' });
  });
});

describe('drawAiGiveawayWinners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCount.mockResolvedValue(0);
    mockTransaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        await Promise.all(arg);
        return [];
      }
      return arg;
    });
    mockUpdate.mockResolvedValue({});
    mockFindUnique.mockResolvedValue({ email: 'winner@example.com', name: 'Winner' });
    mockSendPlanWelcomeEmail.mockResolvedValue(undefined);
  });

  it('draws from PLATFORM_LAUNCH claimants and upgrades them to AI', async () => {
    mockFindMany.mockResolvedValue([{ userId: 'user-1', id: 'redemption-1' }]);

    const result = await drawAiGiveawayWinners('admin-1', 1);

    expect(result).toEqual(
      expect.objectContaining({ success: true, winnerCount: 1, emailFailures: 0 })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'redemption-1' },
        data: expect.objectContaining({ kind: 'AI_GIVEAWAY', grantedBy: 'admin-1' }),
      })
    );
    expect(mockSendPlanWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ planType: 'ai', context: 'launch_ai_draw_win' })
    );
  });

  it('returns no_eligible when no platform claimants remain', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await drawAiGiveawayWinners('admin-1');

    expect(result).toEqual({ error: 'no_eligible' });
  });
});
