import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { claimPlatformLaunchOffer } from '../launch-offer-grant';
import * as launchOffer from '@/lib/launch-offer';
import { Prisma } from '@prisma/client';

describe('claimPlatformLaunchOffer race condition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(launchOffer, 'isLaunchOfferActive').mockReturnValue(true);
    mockFindUnique.mockResolvedValue(null);
  });

  it('passes isolationLevel: Serializable to prevent phantom reads in concurrent claims', async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>, options?: { isolationLevel?: string }) => {
      expect(options).toEqual({ isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return { success: true };
    });

    await claimPlatformLaunchOffer('user-race-1');
    expect(mockTransaction).toHaveBeenCalled();
  });
});
