export const LAUNCH_PLATFORM_SLOTS = 50;
export const LAUNCH_AI_WINNER_SLOTS = 5;
export const LAUNCH_OFFER_MONTHS = 3;

/** Public campaign deadline — AI lucky draw winners announced after this date. */
export const LAUNCH_OFFER_CAMPAIGN_END_ISO = '2026-07-15T23:59:59.999Z';

export type LaunchOfferCountdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

export function getLaunchOfferCampaignEndsAt(): Date {
  const endsAt = process.env.LAUNCH_OFFER_ENDS_AT ?? process.env.NEXT_PUBLIC_LAUNCH_OFFER_ENDS_AT;
  if (endsAt) return new Date(endsAt);
  return new Date(LAUNCH_OFFER_CAMPAIGN_END_ISO);
}

export type LaunchOfferPublicStats = {
  platformClaimed: number;
  platformRemaining: number;
  aiWinners: number;
  aiEligible: number;
  isActive: boolean;
};

export type LaunchOfferUserState = {
  hasRedeemed: boolean;
  redemptionKind: 'PLATFORM_LAUNCH' | 'AI_GIVEAWAY' | null;
  isEligibleForAiDraw: boolean;
};

export function getLaunchOfferExpiry(from = new Date()): Date {
  const expiry = new Date(from);
  expiry.setMonth(expiry.getMonth() + LAUNCH_OFFER_MONTHS);
  return expiry;
}

export function isLaunchOfferActive(now = new Date()): boolean {
  return now < getLaunchOfferCampaignEndsAt();
}

export function getLaunchOfferCountdown(now = new Date()): LaunchOfferCountdown {
  const diff = getLaunchOfferCampaignEndsAt().getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    ended: false,
  };
}

export function formatLaunchOfferCountdown(parts: LaunchOfferCountdown): string {
  if (parts.ended) return 'Ended';
  return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
}

export function buildLaunchOfferStats(
  platformClaimed: number,
  aiWinners: number,
  aiEligible: number,
  now = new Date()
): LaunchOfferPublicStats {
  return {
    platformClaimed,
    platformRemaining: Math.max(0, LAUNCH_PLATFORM_SLOTS - platformClaimed),
    aiWinners,
    aiEligible,
    isActive: isLaunchOfferActive(now),
  };
}
