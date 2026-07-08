'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isPracticeIntent } from '@/lib/onboarding';

export async function skipOnboarding() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
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
  practiceIntent: string = ''
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        targetCompanies,
        preferredDifficulty,
        focusAreas,
        practiceIntent: isPracticeIntent(practiceIntent) ? practiceIntent : '',
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
