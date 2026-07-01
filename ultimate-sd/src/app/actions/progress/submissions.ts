'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProgressStatus } from '@prisma/client';
import { calculateLevel, calculateStreak } from '@/lib/gamification-logic';
import { getStepsForProblem } from '@/lib/problem-steps';
import { PROBLEMS } from '@/lib/problems';
import { computeProgressPercent, countTotalSteps, parseStepPhase } from '@/lib/progress-utils';

function resolveProblemSlug(problemId: string, problemSlug?: string): string | undefined {
  if (problemSlug) return problemSlug;
  return PROBLEMS.find((p) => p.id === problemId)?.slug;
}

export async function recordStepSubmission(input: {
  sessionId: string;
  problemId: string;
  stepId: string;
  phase: string;
  content: string;
  feedback: string | null;
  score: number | null;
  isPassing: boolean;
  problemSlug?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!input.content.trim()) {
    return { success: true, skipped: true };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stepSubmission.create({
        data: {
          userId,
          problemId: input.problemId,
          sessionId: input.sessionId,
          stepId: input.stepId,
          phase: input.phase,
          content: input.content,
          feedback: input.feedback,
          score: input.score,
          isPassing: input.isPassing,
        },
      });

      const progress = await tx.problemProgress.findUnique({
        where: {
          userId_problemId: { userId, problemId: input.problemId },
        },
      });

      const completedStepIds = [...(progress?.completedStepIds ?? [])];
      if (input.isPassing && !completedStepIds.includes(input.stepId)) {
        completedStepIds.push(input.stepId);
      }

      const slug = resolveProblemSlug(input.problemId, input.problemSlug);
      const steps = slug ? getStepsForProblem(slug) : undefined;
      const totalSteps = steps ? countTotalSteps(steps) : 0;
      const progressPercent = computeProgressPercent(completedStepIds, totalSteps);

      await tx.problemProgress.upsert({
        where: {
          userId_problemId: { userId, problemId: input.problemId },
        },
        create: {
          userId,
          problemId: input.problemId,
          status: ProgressStatus.IN_PROGRESS,
          completedStepIds,
          progressPercent,
          lastAttemptAt: now,
        },
        update: {
          completedStepIds,
          progressPercent,
          lastAttemptAt: now,
        },
      });
    });

    revalidatePath('/');
    revalidatePath(`/practice/${input.problemId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to record step submission:', error);
    return { success: false, error: 'Failed to record submission' };
  }
}

export async function awardStepXp(problemId: string, stepId: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  const userEmail = session.user.email;
  const now = new Date();
  const XP_PER_STEP = 20;

  try {
    const existingProgress = await prisma.problemProgress.findUnique({
      where: {
        userId_problemId: { userId, problemId },
      },
    });

    if ((existingProgress?.completedStepIds ?? []).includes(stepId)) {
      return { success: true, xpAwarded: 0, message: 'Step already completed' };
    }

    const user = await prisma.user.findFirst({ where: { email: { equals: userEmail, mode: 'insensitive' } } });
    if (!user) throw new Error('User not found');

    const currentXp = user.xp || 0;
    const currentLevel = user.level || 1;
    const newStreak = calculateStreak(user.streak || 0, user.lastPracticeAt, now);
    const newXp = currentXp + XP_PER_STEP;
    const newLevel = calculateLevel(newXp);

    await prisma.user.update({
      where: { email: userEmail },
      data: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastPracticeAt: now,
      },
    });

    revalidatePath('/');
    revalidatePath(`/practice/${problemId}`);

    return {
      success: true,
      xpAwarded: XP_PER_STEP,
      newLevel,
      levelUp: newLevel > currentLevel,
      currentXp: newXp,
    };
  } catch (error) {
    console.error('Failed to award step XP:', error);
    return { success: false, error: 'Failed to award XP' };
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
): Promise<{
  success: boolean;
  error?: string;
  xpAwarded?: number;
  levelUp?: boolean;
  newLevel?: number;
  currentXp?: number;
  message?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    const progress = await prisma.problemProgress.findUnique({
      where: {
        userId_problemId: { userId, problemId },
      },
      include: { activeSession: true },
    });

    const wasAlreadyCompleted = (progress?.completedStepIds ?? []).includes(stepId);
    const sessionId = progress?.activeSessionId;

    if (!sessionId) {
      return { success: false, error: 'No active session' };
    }

    if (!submissionData.content.trim()) {
      return { success: true, xpAwarded: 0 };
    }

    let xpResult: Awaited<ReturnType<typeof awardStepXp>> | undefined;
    if (submissionData.isPassing && !wasAlreadyCompleted) {
      xpResult = await awardStepXp(problemId, stepId);
    }

    const recordResult = await recordStepSubmission({
      sessionId,
      problemId,
      stepId,
      phase: parseStepPhase(stepId),
      content: submissionData.content,
      feedback: submissionData.feedback ?? null,
      score: submissionData.score ?? null,
      isPassing: submissionData.isPassing ?? false,
    });

    if (!recordResult.success) {
      return recordResult;
    }

    if (xpResult) {
      return { ...xpResult };
    }

    if (wasAlreadyCompleted) {
      return { success: true, xpAwarded: 0, message: 'Step already completed' };
    }

    return { success: true, xpAwarded: 0 };
  } catch (error) {
    console.error('Failed to complete step:', error);
    return { success: false, error: 'Failed to complete step' };
  }
}

export async function updateProblemProgress(
  problemId: string,
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_NEEDED' | 'COMPLETED',
  score?: number,
  currentStep?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  const now = new Date();

  let nextRepetitionDate: Date | null = null;
  if (status === 'COMPLETED') {
    nextRepetitionDate = new Date(now);
    nextRepetitionDate.setDate(nextRepetitionDate.getDate() + 7);
  } else if (status === 'REVIEW_NEEDED') {
    nextRepetitionDate = new Date(now);
    nextRepetitionDate.setDate(nextRepetitionDate.getDate() + 1);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.problemProgress.upsert({
        where: {
          userId_problemId: { userId, problemId },
        },
        update: {
          status,
          lastAttemptAt: now,
          ...(score !== undefined && { lastScore: score }),
          ...(currentStep !== undefined && { currentStep }),
          ...(nextRepetitionDate && { nextRepetitionDate }),
        },
        create: {
          userId,
          problemId,
          status,
          lastAttemptAt: now,
          lastScore: score,
          currentStep,
          nextRepetitionDate,
        },
      });

      if (status === 'COMPLETED') {
        const completedCount = await tx.problemProgress.count({
          where: { userId, status: ProgressStatus.COMPLETED },
        });

        await tx.user.update({
          where: { id: userId },
          data: { completedProblems: completedCount },
        });
      }
    });

    revalidatePath('/');
    revalidatePath(`/practice/${problemId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update progress:', error);
    return { success: false, error: 'Failed to save progress' };
  }
}

export async function getStepSubmissions(
  problemId: string,
  stepId: string,
  sessionId?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const submissions = await prisma.stepSubmission.findMany({
      where: {
        userId: session.user.id,
        problemId,
        stepId,
        ...(sessionId && { sessionId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, submissions };
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return { success: false, error: 'Failed to fetch history' };
  }
}
