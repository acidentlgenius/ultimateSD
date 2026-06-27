'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { buildSessionDetail } from '@/lib/session-detail-builder';
import { deriveDisplayStatus } from '@/lib/progress-utils';
import type {
  ProblemWithStatus,
  SessionDetail,
} from '@/types';

export async function getUserProgressMap(): Promise<Map<string, Partial<ProblemWithStatus>>> {
  const session = await auth();
  if (!session?.user?.id) return new Map();

  const userId = session.user.id;

  const [progressRows, allSessions] = await Promise.all([
    prisma.problemProgress.findMany({
      where: { userId },
      include: { activeSession: true },
    }),
    prisma.practiceSession.findMany({
      where: { userId },
      select: { problemId: true, status: true },
    }),
  ]);

  const sessionsByProblem = new Map<string, { status: string }[]>();
  for (const s of allSessions) {
    const list = sessionsByProblem.get(s.problemId) ?? [];
    list.push({ status: s.status });
    sessionsByProblem.set(s.problemId, list);
  }

  const map = new Map<string, Partial<ProblemWithStatus>>();

  for (const row of progressRows) {
    const sessions = sessionsByProblem.get(row.problemId) ?? [];
    const status = deriveDisplayStatus({
      sessions: sessions as { status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' }[],
      summaryStatus: row.status,
      nextRepetitionDate: row.nextRepetitionDate,
    });

    map.set(row.problemId, {
      status,
      progress: row.progressPercent,
      lastPracticed: row.lastAttemptAt ?? undefined,
      totalAttempts: row.totalAttempts,
      bestScore: row.bestScore ?? undefined,
      nextRepetitionDate: row.nextRepetitionDate ?? undefined,
    });
  }

  return map;
}

export async function getActiveSession(problemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const progress = await prisma.problemProgress.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId,
        },
      },
      include: {
        activeSession: {
          include: {
            submissions: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!progress?.activeSession) {
      return { success: true, session: null, submissions: [] };
    }

    return {
      success: true,
      session: progress.activeSession,
      submissions: progress.activeSession.submissions,
      completedStepIds: progress.completedStepIds,
      progressPercent: progress.progressPercent,
    };
  } catch (error) {
    console.error('Failed to get active session:', error);
    return { success: false, error: 'Failed to get active session' };
  }
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const practiceSession = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    include: {
      submissions: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!practiceSession || practiceSession.userId !== session.user.id) {
    return null;
  }

  const problem = PROBLEMS.find((p) => p.id === practiceSession.problemId);
  const slug = problem?.slug ?? practiceSession.problemId;

  return buildSessionDetail(
    practiceSession,
    problem?.title ?? 'Unknown Problem',
    slug
  );
}
