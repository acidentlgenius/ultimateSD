export const LAUNCH_PLATFORM_SLOTS = 50;
export const LAUNCH_AI_WINNER_SLOTS = 5;
export const LAUNCH_OFFER_MONTHS = 3;

export type LaunchOfferPublicStats = {
  platformClaimed: number;
  platformRemaining: number;
  aiWinners: number;
  aiEntries: number;
  isActive: boolean;
};

export type LaunchOfferUserState = {
  hasRedeemed: boolean;
  redemptionKind: 'PLATFORM_LAUNCH' | 'AI_GIVEAWAY' | null;
  hasEnteredGiveaway: boolean;
};

export function getLaunchOfferExpiry(from = new Date()): Date {
  const expiry = new Date(from);
  expiry.setMonth(expiry.getMonth() + LAUNCH_OFFER_MONTHS);
  return expiry;
}

export function isLaunchOfferActive(now = new Date()): boolean {
  const endsAt = process.env.LAUNCH_OFFER_ENDS_AT;
  if (!endsAt) return true;
  return now < new Date(endsAt);
}

export function buildLaunchOfferStats(
  platformClaimed: number,
  aiWinners: number,
  aiEntries: number,
  now = new Date()
): LaunchOfferPublicStats {
  return {
    platformClaimed,
    platformRemaining: Math.max(0, LAUNCH_PLATFORM_SLOTS - platformClaimed),
    aiWinners,
    aiEntries,
    isActive: isLaunchOfferActive(now),
  };
}
