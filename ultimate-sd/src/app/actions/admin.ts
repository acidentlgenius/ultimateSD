'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  getAdminGrantExpiryDate,
  getInitialAiCreditsForPlan,
  getNextAiCreditsResetDate,
} from '@/lib/access';
import { EmailConfigurationError, sendPlanWelcomeEmail } from '@/lib/email';
import { grantAdminPlatformPlan } from '@/lib/launch-offer-grant';
import { type PlanType } from '@/lib/plans';

export type UpdateUserPlanOptions = {
  consumeLaunchOfferSlot?: boolean;
};

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

export async function updateUserPlan(
  userId: string,
  planType: PlanType,
  options?: UpdateUserPlanOptions
) {
  const adminId = await requireAdmin();

  const now = new Date();
  let planExpiresAt =
    planType !== 'free' ? getAdminGrantExpiryDate(now) : null;
  let launchOfferSlotUsed = false;

  try {
    if (planType === 'platform') {
      const grantResult = await grantAdminPlatformPlan(
        userId,
        adminId,
        options?.consumeLaunchOfferSlot === true
      );

      if ('error' in grantResult) {
        if (grantResult.error === 'sold_out') {
          return { error: 'All launch offer platform slots are taken' };
        }
        return { error: 'This user has already redeemed a launch offer' };
      }

      planExpiresAt = grantResult.expiresAt;
      launchOfferSlotUsed = grantResult.launchOfferSlotUsed;
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          planType,
          planExpiresAt,
          planActivatedAt: planType !== 'free' ? now : null,
          aiCredits: getInitialAiCreditsForPlan(planType),
          aiCreditsResetAt: planType === 'ai' ? getNextAiCreditsResetDate(now) : null,
        },
      });
    }

    let emailSent = false;

    if (planType === 'platform' || planType === 'lifetime' || planType === 'ai') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        try {
          await sendPlanWelcomeEmail({
            email: user.email,
            name: user.name,
            planType,
            expiresAt: planExpiresAt!,
            context:
              launchOfferSlotUsed && planType === 'platform'
                ? 'launch_platform_claim'
                : 'default',
          });
          emailSent = true;
        } catch (error) {
          if (error instanceof EmailConfigurationError) {
            console.error('Plan welcome email config error:', error.message);
          } else {
            console.error('Plan welcome email error:', error);
          }
        }
      }
    }

    revalidatePath('/admin');
    if (launchOfferSlotUsed) {
      revalidatePath('/');
      revalidatePath('/pricing');
    }
    return { success: true, emailSent, launchOfferSlotUsed };
  } catch (error) {
    console.error('Failed to update user plan:', error);
    return { error: 'Failed to update user plan' };
  }
}

export async function revokeUserAccess(userId: string) {
  await requireAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'free',
        planExpiresAt: null,
        planActivatedAt: null,
        aiCredits: 0,
        aiCreditsResetAt: null,
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to revoke access:', error);
    return { error: 'Failed to revoke access' };
  }
}
