'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isExperienceLevel, isPracticeIntent } from '@/lib/onboarding';
import {
  resolveSessionUserId,
  SESSION_STALE_MESSAGE,
} from '@/lib/session-user';

export async function skipOnboarding() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    throw new Error('Unauthorized');
  }

  try {
    const userId = await resolveSessionUserId(session.user);
    if (!userId) {
      return {
        success: false,
        error: 'session_stale',
        message: SESSION_STALE_MESSAGE,
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to skip onboarding:', error);
    return { success: false, error: 'Failed to skip onboarding' };
  }
}

export async function saveUserPreferences(
  targetCompanies: string[],
  preferredDifficulty: string[],
  focusAreas: string[],
  practiceIntent: string = '',
  experienceLevel: string = '',
  targetRole?: string
) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    throw new Error('Unauthorized');
  }

  try {
    const userId = await resolveSessionUserId(session.user);
    if (!userId) {
      return {
        success: false,
        error: 'session_stale',
        message: SESSION_STALE_MESSAGE,
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        targetCompanies,
        preferredDifficulty,
        focusAreas,
        practiceIntent: isPracticeIntent(practiceIntent) ? practiceIntent : '',
        experienceLevel: isExperienceLevel(experienceLevel) ? experienceLevel : '',
        targetRole: targetRole?.trim() || null,
        onboardingCompleted: true,
      },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}
