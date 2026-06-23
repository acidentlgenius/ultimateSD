'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { calculateLevel, calculateStreak } from '@/lib/gamification-logic';

// Actions for progress

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
        await prisma.$transaction(async (tx: any) => {
            await tx.problemProgress.upsert({
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
                const completedCount = await tx.problemProgress.count({
                    where: {
                        userId,
                        status: 'COMPLETED'
                    }
                });

                await tx.user.update({
                    where: { id: userId },
                    data: { completedProblems: completedCount }
                });
            }
        });

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

export async function startPracticeSession(problemId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Check existing progress
        const existing = await prisma.problemProgress.findUnique({
            where: {
                userId_problemId: {
                    userId: session.user.id,
                    problemId
                }
            }
        });

        // If already started, return existing startedAt
        if ((existing as any)?.startedAt) {
            return { success: true, startedAt: (existing as any).startedAt };
        }

        // Initialize startedAt
        const result = await prisma.problemProgress.upsert({
            where: {
                userId_problemId: {
                    userId: session.user.id,
                    problemId
                }
            },
            create: {
                userId: session.user.id,
                problemId,
                status: 'IN_PROGRESS',
                startedAt: new Date(),
                isTimerRunning: true, // Auto-start
                totalPausedSeconds: 0,
                lastAttemptAt: new Date(),
                attempts: 1
            } as any,
            update: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
                isTimerRunning: true, // Reset to running on restart
                lastPausedAt: null, // Clear pause state
                totalPausedSeconds: 0, // Reset pause duration on full restart
                lastAttemptAt: new Date()
            } as any
        });

        revalidatePath(`/practice/${problemId}`);
        const resultTyped = result as any;
        return {
            success: true,
            startedAt: resultTyped.startedAt,
            isTimerRunning: resultTyped.isTimerRunning ?? true,
            totalPausedSeconds: resultTyped.totalPausedSeconds ?? 0,
            lastPausedAt: resultTyped.lastPausedAt
        };
    } catch (error) {
        console.error('Failed to start practice session:', error);
        return { success: false, error: 'Failed to start session' };
    }
}

export async function togglePracticeTimer(problemId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const existing = await prisma.problemProgress.findUnique({
            where: {
                userId_problemId: {
                    userId: session.user.id,
                    problemId
                }
            }
        }) as any;

        if (!existing) {
            return { success: false, error: 'Session not found' };
        }

        const now = new Date();
        let newData: any = {};


        console.log('togglePracticeTimer: Current DB state:', {
            isTimerRunning: existing.isTimerRunning,
            lastPausedAt: existing.lastPausedAt
        });

        if (existing.isTimerRunning) {
            // Pause
            newData = {
                isTimerRunning: false,
                lastPausedAt: now
            };
        } else {
            // Resume
            const lastPaused = existing.lastPausedAt ? new Date(existing.lastPausedAt) : now;
            const pauseDuration = Math.round((now.getTime() - lastPaused.getTime()) / 1000);

            newData = {
                isTimerRunning: true,
                lastPausedAt: null,
                totalPausedSeconds: (existing.totalPausedSeconds || 0) + pauseDuration
            };
        }

        console.log('togglePracticeTimer: Updating with:', newData);

        const result = await prisma.problemProgress.update({
            where: {
                userId_problemId: {
                    userId: session.user.id,
                    problemId
                }
            },
            data: newData
        }) as any;

        console.log('togglePracticeTimer: New DB state:', {
            isTimerRunning: result.isTimerRunning,
            totalPausedSeconds: result.totalPausedSeconds
        });

        revalidatePath(`/practice/${problemId}`);
        return {
            success: true,
            isTimerRunning: result.isTimerRunning,
            totalPausedSeconds: result.totalPausedSeconds,
            lastPausedAt: result.lastPausedAt
        };
    } catch (error) {
        console.error('Failed to toggle timer:', error);
        return { success: false, error: 'Failed to toggle timer' };
    }
}

export async function completeStep(
    problemId: string,
    stepId: string,
    submissionData: {
        content: string;
        feedback?: string;
        score?: number;
        isPassing?: boolean;
    }
) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
        throw new Error('Unauthorized');
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const now = new Date();
    const XP_PER_STEP = 20;

    try {
        // 1. Fetch current progress to check if step is already completed
        const existingProgress = await prisma.problemProgress.findUnique({
            where: {
                userId_problemId: {
                    userId,
                    problemId
                }
            }
        });

        const completedStepIds = existingProgress?.completedStepIds || [];

        // 3. Idempotency check before transaction
        if (completedStepIds.includes(stepId)) {
            // If already completed, just record the submission
            await prisma.stepSubmission.create({
                data: {
                    userId,
                    problemId,
                    stepId,
                    content: submissionData.content,
                    feedback: submissionData.feedback || null,
                    score: submissionData.score || null,
                    isPassing: submissionData.isPassing || false
                }
            });
            return { success: true, xpAwarded: 0, message: 'Step already completed' };
        }

        const user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user) throw new Error('User not found');

        const currentXp = user.xp || 0;
        const currentLevel = user.level || 1;

        // Calculate Streak
        const currentStreak = user.streak || 0;
        const lastPractice = user.lastPracticeAt;
        const newStreak = calculateStreak(currentStreak, lastPractice, now);

        const newXp = currentXp + XP_PER_STEP;
        const newLevel = calculateLevel(newXp);

        await prisma.$transaction([
            // Record Submission History (Always)
            prisma.stepSubmission.create({
                data: {
                    userId,
                    problemId,
                    stepId,
                    content: submissionData.content,
                    feedback: submissionData.feedback || null,
                    score: submissionData.score || null,
                    isPassing: submissionData.isPassing || false
                }
            }),
            // Update Progress (mark step as complete)
            prisma.problemProgress.upsert({
                where: {
                    userId_problemId: {
                        userId,
                        problemId
                    }
                },
                update: {
                    completedStepIds: {
                        push: stepId
                    },
                    lastAttemptAt: now
                },
                create: {
                    userId,
                    problemId,
                    status: 'IN_PROGRESS',
                    startedAt: now,
                    completedStepIds: [stepId],
                    lastAttemptAt: now,
                    attempts: 1
                }
            }),
            // Update User XP
            prisma.user.update({
                where: { email: userEmail },
                data: {
                    xp: newXp,
                    level: newLevel,
                    streak: newStreak,
                    lastPracticeAt: now
                }
            })
        ]);

        revalidatePath('/');
        revalidatePath(`/practice/${problemId}`);

        return {
            success: true,
            xpAwarded: XP_PER_STEP,
            newLevel,
            levelUp: newLevel > currentLevel,
            currentXp: newXp
        };

    } catch (error) {
        console.error('Failed to complete step:', error);
        return { success: false, error: 'Failed to complete step' };
    }
}

export async function syncSessionState(problemId: string, sessionState: any) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const userId = session.user.id;
    const now = new Date();

    try {
        await prisma.problemProgress.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId
                }
            },
            update: {
                sessionState,
                lastAttemptAt: now
            },
            create: {
                userId,
                problemId,
                status: 'IN_PROGRESS',
                sessionState,
                startedAt: now,
                lastAttemptAt: now,
                attempts: 1
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to sync session state:', error);
        return { success: false, error: 'Failed to sync session state' };
    }
}

export async function getSavedSessionState(problemId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const progress = await prisma.problemProgress.findUnique({
            where: {
                userId_problemId: {
                    userId: session.user.id,
                    problemId
                }
            },
            select: {
                sessionState: true
            }
        });

        return { success: true, sessionState: progress?.sessionState || null };
    } catch (error) {
        console.error('Failed to get saved session state:', error);
        return { success: false, error: 'Failed to get saved session state' };
    }
}

export async function getStepSubmissions(problemId: string, stepId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const submissions = await prisma.stepSubmission.findMany({
            where: {
                userId: session.user.id,
                problemId,
                stepId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Parse feedback JSON if it's a string, just to be safe or leave it for client
        // The client component handles JSON.parse

        return { success: true, submissions };
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        return { success: false, error: 'Failed to fetch history' };
    }
}
