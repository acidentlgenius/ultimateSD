'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { calculateLevel, calculateStreak } from '@/lib/gamification-logic';

// Interface to handle stale Prisma types
interface UserWithGamification {
    xp: number;
    level: number;
    streak: number;
    lastPracticeAt: Date | null;
}

export async function updateProgress(xpAmount: number) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        return { error: 'Unauthorized' };
    }

    try {
        const userRaw = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (!userRaw) {
            return { error: 'User not found' };
        }

        // Cast to bypass stale types
        const user = userRaw as unknown as UserWithGamification;
        const currentXp = user.xp;
        const currentLevel = user.level;

        const newXp = currentXp + xpAmount;
        const newLevel = calculateLevel(newXp);

        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                xp: newXp,
                level: newLevel,
            } as any,
        }) as unknown as UserWithGamification;

        revalidatePath('/'); // Update header stats
        return {
            success: true,
            xp: updatedUser.xp,
            level: updatedUser.level,
            levelUp: newLevel > currentLevel
        };
    } catch (error) {
        console.error('Error updating progress:', error);
        return { error: 'Failed to update progress' };
    }
}

export async function updateStreak() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        return { error: 'Unauthorized' };
    }

    try {
        const userRaw = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (!userRaw) {
            return { error: 'User not found' };
        }

        const user = userRaw as unknown as UserWithGamification;
        const now = new Date();
        const lastPractice = user.lastPracticeAt;

        const newStreak = calculateStreak(user.streak, lastPractice ? lastPractice : null, now);

        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                streak: newStreak,
                lastPracticeAt: now,
            } as any,
        }) as unknown as UserWithGamification;

        revalidatePath('/');
        return { success: true, streak: updatedUser.streak };
    } catch (error) {
        console.error('Error updating streak:', error);
        return { error: 'Failed to update streak' };
    }
}
