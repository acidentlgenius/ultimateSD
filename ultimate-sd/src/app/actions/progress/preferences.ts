'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveUserPreferences(
  targetCompanies: string[],
  preferredDifficulty: string[],
  focusAreas: string[]
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
