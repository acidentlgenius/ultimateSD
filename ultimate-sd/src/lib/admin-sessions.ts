import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { buildSessionDetail } from '@/lib/session-detail-builder';
import type { AdminSessionDetail, AdminSessionSummary } from '@/lib/admin-sessions-types';

function getProblemMeta(problemId: string) {
  const problem = PROBLEMS.find((p) => p.id === problemId);
  return {
    title: problem?.title ?? `Problem ${problemId}`,
    slug: problem?.slug ?? problemId,
  };
}

function computeDurationMinutes(
  startedAt: Date,
  completedAt: Date | null,
  totalPausedSeconds: number
): number {
  const end = completedAt ?? new Date();
  const elapsedSeconds = (end.getTime() - startedAt.getTime()) / 1000;
  const effectiveSeconds = Math.max(0, elapsedSeconds - totalPausedSeconds);
  return Math.round(effectiveSeconds / 60);
}

export async function getAdminSessions(limit = 200): Promise<AdminSessionSummary[]> {
  const sessions = await prisma.practiceSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
      submissions: { select: { id: true, isPassing: true } },
    },
  });

  return sessions.map((session) => {
    const { title, slug } = getProblemMeta(session.problemId);
    return {
      id: session.id,
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      problemId: session.problemId,
      problemTitle: title,
      problemSlug: slug,
      status: session.status,
      attemptNumber: session.attemptNumber,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      finalScore: session.finalScore,
      submissionCount: session.submissions.length,
      passingCount: session.submissions.filter((s) => s.isPassing).length,
      durationMinutes: computeDurationMinutes(
        session.startedAt,
        session.completedAt,
        session.totalPausedSeconds
      ),
      totalPausedSeconds: session.totalPausedSeconds,
    };
  });
}

export async function getAdminSessionDetailById(
  sessionId: string
): Promise<AdminSessionDetail | null> {
  const practiceSession = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true, email: true } },
      submissions: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!practiceSession) return null;

  const { title, slug } = getProblemMeta(practiceSession.problemId);
  const detail = buildSessionDetail(practiceSession, title, slug);

  return {
    ...detail,
    userName: practiceSession.user.name,
    userEmail: practiceSession.user.email,
  };
}
