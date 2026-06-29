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
import { type PlanType } from '@/lib/plans';

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

export async function updateUserPlan(userId: string, planType: PlanType) {
  await requireAdmin();

  const now = new Date();
  const planExpiresAt =
    planType !== 'free' ? getAdminGrantExpiryDate(now) : null;

  try {
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

    let emailSent = false;

    if (planType === 'platform' || planType === 'ai') {
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
    return { success: true, emailSent };
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
