import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { SessionStatus } from '@prisma/client';

export type AdminActivityType =
  | 'session_started'
  | 'session_completed'
  | 'session_abandoned'
  | 'step_submitted';

export interface AdminActivityItem {
  id: string;
  type: AdminActivityType;
  timestamp: Date;
  userId: string;
  userName: string | null;
  userEmail: string;
  problemId: string;
  problemTitle: string;
  sessionStatus?: SessionStatus;
  stepId?: string;
  phase?: string;
  score?: number | null;
  isPassing?: boolean;
  attemptNumber?: number;
}

function getProblemTitle(problemId: string): string {
  const problem = PROBLEMS.find((p) => p.id === problemId);
  return problem?.title ?? `Problem ${problemId}`;
}

function sessionActivityType(status: SessionStatus): AdminActivityType {
  switch (status) {
    case SessionStatus.COMPLETED:
      return 'session_completed';
    case SessionStatus.ABANDONED:
      return 'session_abandoned';
    case SessionStatus.ACTIVE:
      return 'session_started';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export async function getAdminActivities(limit = 100): Promise<AdminActivityItem[]> {
  const [sessions, submissions] = await Promise.all([
    prisma.practiceSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.stepSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const sessionActivities: AdminActivityItem[] = sessions.map((session) => ({
    id: `session-${session.id}`,
    type: sessionActivityType(session.status),
    timestamp: session.completedAt ?? session.startedAt,
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    problemId: session.problemId,
    problemTitle: getProblemTitle(session.problemId),
    sessionStatus: session.status,
    score: session.finalScore,
    attemptNumber: session.attemptNumber,
  }));

  const submissionActivities: AdminActivityItem[] = submissions.map((submission) => ({
    id: `submission-${submission.id}`,
    type: 'step_submitted',
    timestamp: submission.createdAt,
    userId: submission.user.id,
    userName: submission.user.name,
    userEmail: submission.user.email,
    problemId: submission.problemId,
    problemTitle: getProblemTitle(submission.problemId),
    stepId: submission.stepId,
    phase: submission.phase,
    score: submission.score,
    isPassing: submission.isPassing,
  }));

  return [...sessionActivities, ...submissionActivities]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getActivityLabel(type: AdminActivityType): string {
  switch (type) {
    case 'session_started':
      return 'Started practice session';
    case 'session_completed':
      return 'Completed practice session';
    case 'session_abandoned':
      return 'Abandoned practice session';
    case 'step_submitted':
      return 'Submitted step';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
