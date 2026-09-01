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

export type DrawWinnersResult =
  | { success: true; winnerCount: number; emailFailures: number }
  | { error: 'giveaway_full' | 'no_eligible' };

export type AdminPlatformGrantResult =
  | { success: true; expiresAt: Date; launchOfferSlotUsed: boolean }
  | { error: 'sold_out' | 'already_redeemed' };

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

async function countPlatformSlotsUsed(tx: PrismaTx | typeof prisma): Promise<number> {
  return tx.launchOfferRedemption.count({
    where: { kind: { in: ['PLATFORM_LAUNCH', 'AI_GIVEAWAY'] } },
  });
}

export async function getLaunchOfferStats(): Promise<LaunchOfferPublicStats> {
  try {
    const [platformClaimed, aiWinners, aiEligible] = await Promise.all([
      prisma.launchOfferRedemption.count({
        where: { kind: { in: ['PLATFORM_LAUNCH', 'AI_GIVEAWAY'] } },
      }),
      prisma.launchOfferRedemption.count({ where: { kind: 'AI_GIVEAWAY' } }),
      prisma.launchOfferRedemption.count({ where: { kind: 'PLATFORM_LAUNCH' } }),
    ]);

    return buildLaunchOfferStats(platformClaimed, aiWinners, aiEligible);
  } catch (error) {
    console.error("Failed to get launch offer stats (database likely unavailable during build)", error);
    return buildLaunchOfferStats(0, 0, 0);
  }
}

export async function getLaunchOfferUserState(userId: string): Promise<LaunchOfferUserState> {
  const redemption = await prisma.launchOfferRedemption.findUnique({ where: { userId } });

  return {
    hasRedeemed: Boolean(redemption),
    redemptionKind: redemption?.kind ?? null,
    isEligibleForAiDraw: redemption?.kind === 'PLATFORM_LAUNCH',
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

    const claimed = await countPlatformSlotsUsed(tx);
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
    if (result.error === 'already_redeemed') {
      return { error: 'already_redeemed' };
    }
    return { error: 'sold_out' };
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

    const claimed = await countPlatformSlotsUsed(tx);
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
        context: 'launch_platform_claim',
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

  const eligible = await prisma.launchOfferRedemption.findMany({
    where: { kind: 'PLATFORM_LAUNCH' },
    select: { userId: true, id: true },
  });

  if (eligible.length === 0) {
    return { error: 'no_eligible' };
  }

  const pickCount = Math.min(count, slotsLeft, eligible.length);
  const winners = shuffleInPlace([...eligible]).slice(0, pickCount);

  let emailFailures = 0;

  for (const { userId, id: redemptionId } of winners) {
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
      prisma.launchOfferRedemption.update({
        where: { id: redemptionId },
        data: { kind: 'AI_GIVEAWAY', expiresAt, grantedBy: adminId },
      }),
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
          context: 'launch_ai_draw_win',
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

export type LaunchOfferClaimantRow = {
  userId: string;
  email: string;
  name: string | null;
  claimedAt: Date;
  kind: 'PLATFORM_LAUNCH' | 'AI_GIVEAWAY';
};

export async function getLaunchOfferRedemptions(): Promise<LaunchOfferRedemptionRow[]> {
  return prisma.launchOfferRedemption.findMany({
    include: {
      user: { select: { email: true, name: true } },
    },
    orderBy: { grantedAt: 'desc' },
  });
}

export async function getLaunchOfferPlatformClaimants(): Promise<LaunchOfferClaimantRow[]> {
  const rows = await prisma.launchOfferRedemption.findMany({
    where: { kind: { in: ['PLATFORM_LAUNCH', 'AI_GIVEAWAY'] } },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { grantedAt: 'asc' },
  });

  return rows.map((r) => ({
    userId: r.userId,
    email: r.user.email,
    name: r.user.name,
    claimedAt: r.grantedAt,
    kind: r.kind,
  }));
}
