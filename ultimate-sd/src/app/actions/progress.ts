'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProblemProgress(problemId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_NEEDED' | 'COMPLETED', score?: number, currentStep?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const userId = session.user.id;
    const now = new Date();

    // Calculate next repetition date based on score (Simple SRS)
    let nextRepetitionDate = null;
    if (status === 'COMPLETED') {
        nextRepetitionDate = new Date(now.setDate(now.getDate() + 7)); // Review in 1 week
    } else if (status === 'REVIEW_NEEDED') {
        nextRepetitionDate = new Date(now.setDate(now.getDate() + 1)); // Review tomorrow
    }

    try {
        await prisma.problemProgress.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId
                }
            },
            update: {
                status,
                lastAttemptAt: new Date(),
                attempts: {
                    increment: 1
                },
                ...(score !== undefined && { lastScore: score }),
                ...(currentStep !== undefined && { currentStep }),
                ...(nextRepetitionDate && { nextRepetitionDate })
            },
            create: {
                userId,
                problemId,
                status,
                lastAttemptAt: new Date(),
                attempts: 1,
                lastScore: score,
                currentStep,
                nextRepetitionDate
            }
        });

        // Update user stats
        if (status === 'COMPLETED') {
            const completedCount = await prisma.problemProgress.count({
                where: {
                    userId,
                    status: 'COMPLETED'
                }
            });

            await prisma.user.update({
                where: { id: userId },
                data: { completedProblems: completedCount }
            });
        }

        revalidatePath('/dashboard');
        revalidatePath(`/practice/${problemId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update progress:', error);
        return { success: false, error: 'Failed to save progress' };
    }
}

export async function saveUserPreferences(targetCompanies: string[], preferredDifficulty: string[], focusAreas: string[]) {
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
                onboardingCompleted: true
            }
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Failed to update preferences:', error);
        return { success: false, error: 'Failed to update preferences' };
    }
}
