'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProgressStatus, SessionStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export async function startPracticeSession(problemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;

  try {
    const existing = await prisma.problemProgress.findUnique({
      where: { userId_problemId: { userId, problemId } },
      include: { activeSession: true },
    });

    if (existing?.activeSession?.status === SessionStatus.ACTIVE) {
      const active = existing.activeSession;
      return {
        success: true,
        sessionId: active.id,
        startedAt: active.startedAt,
        isTimerRunning: active.isTimerRunning,
        totalPausedSeconds: active.totalPausedSeconds,
        lastPausedAt: active.lastPausedAt,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const progress = await tx.problemProgress.findUnique({
        where: { userId_problemId: { userId, problemId } },
      });

      const attemptNumber = (progress?.totalAttempts ?? 0) + 1;
      const now = new Date();

      const practiceSession = await tx.practiceSession.create({
        data: {
          userId,
          problemId,
          status: SessionStatus.ACTIVE,
          attemptNumber,
          isTimerRunning: true,
          totalPausedSeconds: 0,
        },
      });

      await tx.problemProgress.upsert({
        where: { userId_problemId: { userId, problemId } },
        create: {
          userId,
          problemId,
          status: ProgressStatus.IN_PROGRESS,
          activeSessionId: practiceSession.id,
          totalAttempts: 1,
          startedAt: now,
          lastAttemptAt: now,
        },
        update: {
          status: ProgressStatus.IN_PROGRESS,
          activeSessionId: practiceSession.id,
          totalAttempts: attemptNumber,
          lastAttemptAt: now,
          startedAt: progress?.startedAt ?? now,
        },
      });

      return practiceSession;
    });

    revalidatePath(`/practice/${problemId}`);
    return {
      success: true,
      sessionId: result.id,
      startedAt: result.startedAt,
      isTimerRunning: result.isTimerRunning,
      totalPausedSeconds: result.totalPausedSeconds,
      lastPausedAt: result.lastPausedAt,
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
    const progress = await prisma.problemProgress.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId,
        },
      },
      include: { activeSession: true },
    });

    const activeSession = progress?.activeSession;
    if (!activeSession) {
      return { success: false, error: 'Session not found' };
    }

    const now = new Date();
    let updateData: Prisma.PracticeSessionUpdateInput;

    if (activeSession.isTimerRunning) {
      updateData = {
        isTimerRunning: false,
        lastPausedAt: now,
      };
    } else {
      const lastPaused = activeSession.lastPausedAt ? new Date(activeSession.lastPausedAt) : now;
      const pauseDuration = Math.round((now.getTime() - lastPaused.getTime()) / 1000);

      updateData = {
        isTimerRunning: true,
        lastPausedAt: null,
        totalPausedSeconds: activeSession.totalPausedSeconds + pauseDuration,
      };
    }

    const result = await prisma.practiceSession.update({
      where: { id: activeSession.id },
      data: updateData,
    });

    revalidatePath(`/practice/${problemId}`);
    return {
      success: true,
      isTimerRunning: result.isTimerRunning,
      totalPausedSeconds: result.totalPausedSeconds,
      lastPausedAt: result.lastPausedAt,
    };
  } catch (error) {
    console.error('Failed to toggle timer:', error);
    return { success: false, error: 'Failed to toggle timer' };
  }
}

export async function completeSession(
  sessionId: string,
  finalScore: number,
  diagramSnapshot?: unknown
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;
  const now = new Date();
  const nextRepetitionDate = new Date(now);
  nextRepetitionDate.setDate(nextRepetitionDate.getDate() + 7);

  try {
    await prisma.$transaction(async (tx) => {
      const practiceSession = await tx.practiceSession.findUnique({
        where: { id: sessionId },
      });

      if (!practiceSession || practiceSession.userId !== userId) {
        throw new Error('Session not found');
      }

      await tx.practiceSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: now,
          finalScore,
          diagramSnapshot: diagramSnapshot as Prisma.InputJsonValue | undefined,
        },
      });

      const progress = await tx.problemProgress.findUnique({
        where: {
          userId_problemId: { userId, problemId: practiceSession.problemId },
        },
      });

      const bestScore =
        progress?.bestScore != null
          ? Math.max(progress.bestScore, finalScore)
          : finalScore;

      await tx.problemProgress.update({
        where: {
          userId_problemId: { userId, problemId: practiceSession.problemId },
        },
        data: {
          status: ProgressStatus.COMPLETED,
          lastScore: finalScore,
          bestScore,
          nextRepetitionDate,
          lastAttemptAt: now,
        },
      });

      const completedCount = await tx.problemProgress.count({
        where: { userId, status: ProgressStatus.COMPLETED },
      });

      await tx.user.update({
        where: { id: userId },
        data: { completedProblems: completedCount },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to complete session:', error);
    return { success: false, error: 'Failed to complete session' };
  }
}

export async function abandonSession(problemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const progress = await tx.problemProgress.findUnique({
        where: { userId_problemId: { userId, problemId } },
        include: { activeSession: true },
      });

      if (progress?.activeSession?.status === SessionStatus.ACTIVE) {
        await tx.practiceSession.update({
          where: { id: progress.activeSession.id },
          data: { status: SessionStatus.ABANDONED },
        });
      }

      const attemptNumber = (progress?.totalAttempts ?? 0) + 1;
      const now = new Date();

      const newSession = await tx.practiceSession.create({
        data: {
          userId,
          problemId,
          status: SessionStatus.ACTIVE,
          attemptNumber,
          isTimerRunning: true,
          totalPausedSeconds: 0,
        },
      });

      await tx.problemProgress.upsert({
        where: { userId_problemId: { userId, problemId } },
        create: {
          userId,
          problemId,
          status: ProgressStatus.IN_PROGRESS,
          activeSessionId: newSession.id,
          totalAttempts: 1,
          completedStepIds: [],
          progressPercent: 0,
          startedAt: now,
          lastAttemptAt: now,
        },
        update: {
          status: ProgressStatus.IN_PROGRESS,
          activeSessionId: newSession.id,
          totalAttempts: attemptNumber,
          completedStepIds: [],
          progressPercent: 0,
          lastAttemptAt: now,
        },
      });

      return newSession;
    });

    revalidatePath(`/practice/${problemId}`);
    revalidatePath('/');
    return { success: true, sessionId: result.id };
  } catch (error) {
    console.error('Failed to abandon session:', error);
    return { success: false, error: 'Failed to abandon session' };
  }
}
