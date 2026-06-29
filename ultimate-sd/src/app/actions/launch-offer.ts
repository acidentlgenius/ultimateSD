'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import {
  claimPlatformLaunchOffer,
  drawAiGiveawayWinners,
  enterAiGiveaway,
  getLaunchOfferRedemptions,
  getLaunchOfferStats,
  getLaunchOfferUserState,
} from '@/lib/launch-offer-grant';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  return session.user.id;
}

export async function claimLaunchPlatformAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'not_authenticated' as const };
  }

  const result = await claimPlatformLaunchOffer(session.user.id);

  if ('success' in result && result.success) {
    revalidatePath('/');
    revalidatePath('/pricing');
    revalidatePath('/admin');
  }

  return result;
}

export async function enterAiGiveawayAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'not_authenticated' as const };
  }

  const result = await enterAiGiveaway(session.user.id);

  if ('success' in result && result.success) {
    revalidatePath('/');
    revalidatePath('/pricing');
    revalidatePath('/admin');
  }

  return result;
}

export async function drawAiGiveawayWinnersAction() {
  const adminId = await requireAdmin();
  const result = await drawAiGiveawayWinners(adminId);

  if ('success' in result && result.success) {
    revalidatePath('/admin');
    revalidatePath('/pricing');
  }

  return result;
}

export {
  getLaunchOfferStats,
  getLaunchOfferUserState,
  getLaunchOfferRedemptions,
};
