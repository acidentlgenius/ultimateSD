import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransaction = vi.fn();
const mockCount = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockSendPlanWelcomeEmail = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    launchOfferRedemption: {
      count: (...args: unknown[]) => mockCount(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
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

import { claimPlatformLaunchOffer } from '../launch-offer-grant';

describe('claimPlatformLaunchOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect.objectContaining({ email: 'user@example.com', planType: 'platform' })
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
