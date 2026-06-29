import { prisma } from '@/lib/prisma';
import {
  getInitialAiCreditsForPlan,
  getNextAiCreditsResetDate,
} from '@/lib/access';
import { EmailConfigurationError, sendPlanWelcomeEmail } from '@/lib/email';
import {
  buildLaunchOfferStats,
  getLaunchOfferExpiry,
  isLaunchOfferActive,
  LAUNCH_AI_WINNER_SLOTS,
  LAUNCH_PLATFORM_SLOTS,
  type LaunchOfferPublicStats,
  type LaunchOfferUserState,
} from '@/lib/launch-offer';

export type ClaimPlatformResult =
  | { success: true; expiresAt: Date; emailSent: boolean }
  | { error: 'not_authenticated' | 'offer_ended' | 'already_redeemed' | 'sold_out' | 'has_paid_plan' };

export type EnterGiveawayResult =
  | { success: true }
  | { error: 'not_authenticated' | 'offer_ended' | 'already_redeemed' | 'already_entered' | 'has_paid_plan' };

export type DrawWinnersResult =
  | { success: true; winnerCount: number; emailFailures: number }
  | { error: 'giveaway_full' | 'no_entries' };

export type AdminPlatformGrantResult =
  | { success: true; expiresAt: Date; launchOfferSlotUsed: boolean }
  | { error: 'sold_out' | 'already_redeemed' };

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export async function getLaunchOfferStats(): Promise<LaunchOfferPublicStats> {
  const [platformClaimed, aiWinners, aiEntries] = await Promise.all([
    prisma.launchOfferRedemption.count({ where: { kind: 'PLATFORM_LAUNCH' } }),
    prisma.launchOfferRedemption.count({ where: { kind: 'AI_GIVEAWAY' } }),
    prisma.launchOfferEntry.count(),
  ]);

  return buildLaunchOfferStats(platformClaimed, aiWinners, aiEntries);
}

export async function getLaunchOfferUserState(userId: string): Promise<LaunchOfferUserState> {
  const [redemption, entry] = await Promise.all([
    prisma.launchOfferRedemption.findUnique({ where: { userId } }),
    prisma.launchOfferEntry.findUnique({ where: { userId } }),
  ]);

  return {
    hasRedeemed: Boolean(redemption),
    redemptionKind: redemption?.kind ?? null,
    hasEnteredGiveaway: Boolean(entry),
  };
}

async function userHasPaidPlan(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true, planExpiresAt: true },
  });
  if (!user) return false;
  if (user.planType === 'free') return false;
  if (!user.planExpiresAt) return true;
  return user.planExpiresAt > new Date();
}

export async function grantAdminPlatformPlan(
  userId: string,
  adminId: string,
  consumeLaunchOfferSlot: boolean
): Promise<AdminPlatformGrantResult> {
  const now = new Date();
  const expiresAt = getLaunchOfferExpiry(now);
  const planData = {
    planType: 'platform' as const,
    planActivatedAt: now,
    planExpiresAt: expiresAt,
    aiCredits: getInitialAiCreditsForPlan('platform'),
    aiCreditsResetAt: null,
  };

  if (!consumeLaunchOfferSlot) {
    await prisma.user.update({
      where: { id: userId },
      data: planData,
    });
    return { success: true, expiresAt, launchOfferSlotUsed: false };
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.launchOfferRedemption.findUnique({ where: { userId } });
    if (existing) return { error: 'already_redeemed' as const };

    const claimed = await tx.launchOfferRedemption.count({
      where: { kind: 'PLATFORM_LAUNCH' },
    });
    if (claimed >= LAUNCH_PLATFORM_SLOTS) {
      return { error: 'sold_out' as const };
    }

    await tx.user.update({
      where: { id: userId },
      data: planData,
    });

    await tx.launchOfferRedemption.create({
      data: {
        userId,
        kind: 'PLATFORM_LAUNCH',
        expiresAt,
        grantedBy: adminId,
      },
    });

    return { success: true as const, expiresAt };
  });

  if ('error' in result) {
    return result;
  }

  return { success: true, expiresAt: result.expiresAt, launchOfferSlotUsed: true };
}

export async function claimPlatformLaunchOffer(userId: string): Promise<ClaimPlatformResult> {
  if (!isLaunchOfferActive()) {
    return { error: 'offer_ended' };
  }

  if (await userHasPaidPlan(userId)) {
    return { error: 'has_paid_plan' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.launchOfferRedemption.findUnique({ where: { userId } });
    if (existing) return { error: 'already_redeemed' as const };

    const claimed = await tx.launchOfferRedemption.count({
      where: { kind: 'PLATFORM_LAUNCH' },
    });
    if (claimed >= LAUNCH_PLATFORM_SLOTS) {
      return { error: 'sold_out' as const };
    }

    const now = new Date();
    const expiresAt = getLaunchOfferExpiry(now);

    await tx.user.update({
      where: { id: userId },
      data: {
        planType: 'platform',
        planActivatedAt: now,
        planExpiresAt: expiresAt,
        aiCredits: getInitialAiCreditsForPlan('platform'),
        aiCreditsResetAt: null,
      },
    });

    await tx.launchOfferRedemption.create({
      data: {
        userId,
        kind: 'PLATFORM_LAUNCH',
        expiresAt,
      },
    });

    return { success: true as const, expiresAt };
  });

  if (!('success' in result) || !result.success) {
    return result;
  }

  let emailSent = false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (user?.email) {
    try {
      await sendPlanWelcomeEmail({
        email: user.email,
        name: user.name,
        planType: 'platform',
        expiresAt: result.expiresAt,
      });
      emailSent = true;
    } catch (error) {
      if (!(error instanceof EmailConfigurationError)) {
        console.error('Launch offer welcome email error:', error);
      }
    }
  }

  return { success: true, expiresAt: result.expiresAt, emailSent };
}

export async function enterAiGiveaway(userId: string): Promise<EnterGiveawayResult> {
  if (!isLaunchOfferActive()) {
    return { error: 'offer_ended' };
  }

  if (await userHasPaidPlan(userId)) {
    return { error: 'has_paid_plan' };
  }

  const existingRedemption = await prisma.launchOfferRedemption.findUnique({
    where: { userId },
  });
  if (existingRedemption) {
    return { error: 'already_redeemed' };
  }

  const existingEntry = await prisma.launchOfferEntry.findUnique({
    where: { userId },
  });
  if (existingEntry) {
    return { error: 'already_entered' };
  }

  await prisma.launchOfferEntry.create({ data: { userId } });
  return { success: true };
}

export async function drawAiGiveawayWinners(
  adminId: string,
  count = LAUNCH_AI_WINNER_SLOTS
): Promise<DrawWinnersResult> {
  const existingWinners = await prisma.launchOfferRedemption.count({
    where: { kind: 'AI_GIVEAWAY' },
  });
  const slotsLeft = LAUNCH_AI_WINNER_SLOTS - existingWinners;
  if (slotsLeft <= 0) {
    return { error: 'giveaway_full' };
  }

  const entries = await prisma.launchOfferEntry.findMany({
    where: {
      user: {
        launchOfferRedemption: null,
      },
    },
    select: { userId: true },
  });

  if (entries.length === 0) {
    return { error: 'no_entries' };
  }

  const pickCount = Math.min(count, slotsLeft, entries.length);
  const shuffled = shuffleInPlace([...entries]);
  const winners = shuffled.slice(0, pickCount);

  let emailFailures = 0;

  for (const { userId } of winners) {
    const now = new Date();
    const expiresAt = getLaunchOfferExpiry(now);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          planType: 'ai',
          planActivatedAt: now,
          planExpiresAt: expiresAt,
          aiCredits: getInitialAiCreditsForPlan('ai'),
          aiCreditsResetAt: getNextAiCreditsResetDate(now),
        },
      }),
      prisma.launchOfferRedemption.create({
        data: {
          userId,
          kind: 'AI_GIVEAWAY',
          expiresAt,
          grantedBy: adminId,
        },
      }),
      prisma.launchOfferEntry.delete({ where: { userId } }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      try {
        await sendPlanWelcomeEmail({
          email: user.email,
          name: user.name,
          planType: 'ai',
          expiresAt,
        });
      } catch (error) {
        emailFailures += 1;
        if (!(error instanceof EmailConfigurationError)) {
          console.error('AI giveaway welcome email error:', error);
        }
      }
    }
  }

  return { success: true, winnerCount: pickCount, emailFailures };
}

export type LaunchOfferRedemptionRow = {
  id: string;
  kind: 'PLATFORM_LAUNCH' | 'AI_GIVEAWAY';
  grantedAt: Date;
  expiresAt: Date;
  grantedBy: string | null;
  user: { email: string; name: string | null };
};

export async function getLaunchOfferRedemptions(): Promise<LaunchOfferRedemptionRow[]> {
  return prisma.launchOfferRedemption.findMany({
    include: {
      user: { select: { email: true, name: true } },
    },
    orderBy: { grantedAt: 'desc' },
  });
}
