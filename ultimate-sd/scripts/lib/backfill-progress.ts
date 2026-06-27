export type BackfillProgressRow = {
  id: string;
  userId: string;
  problemId: string;
  status: string;
  totalAttempts: number;
  lastScore?: number | null;
  startedAt?: Date | null;
  lastAttemptAt?: Date | null;
  createdAt: Date;
};

export type BackfillSubmissionRow = {
  id: string;
  userId: string;
  problemId: string;
  createdAt?: Date;
};

export type BackfillSessionCreate = {
  tempId: string;
  userId: string;
  problemId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  finalScore?: number;
  isTimerRunning: boolean;
  lastPausedAt?: Date | null;
  totalPausedSeconds: number;
};

export type BackfillPlan = {
  sessions: BackfillSessionCreate[];
  progressUpdates: {
    progressId: string;
    sessionTempId: string;
    setActiveSession: boolean;
    totalAttempts: number;
  }[];
  submissionUpdates: {
    submissionId: string;
    sessionTempId: string;
  }[];
};

function sessionKey(userId: string, problemId: string): string {
  return `${userId}:${problemId}`;
}

function mapProgressStatusToSessionStatus(
  status: string
): 'ACTIVE' | 'COMPLETED' | 'ABANDONED' {
  switch (status) {
    case 'COMPLETED':
      return 'COMPLETED';
    case 'IN_PROGRESS':
    case 'REVIEW_NEEDED':
      return 'ACTIVE';
    default:
      return 'ABANDONED';
  }
}

function shouldBackfillProgress(row: BackfillProgressRow): boolean {
  return row.status !== 'NOT_STARTED' || row.totalAttempts > 0;
}

export function buildBackfillPlan(
  progressRows: BackfillProgressRow[],
  submissionRows: BackfillSubmissionRow[]
): BackfillPlan {
  const sessionsByKey = new Map<string, BackfillSessionCreate>();
  const progressUpdates: BackfillPlan['progressUpdates'] = [];
  const submissionUpdates: BackfillPlan['submissionUpdates'] = [];
  let tempCounter = 0;

  for (const row of progressRows) {
    if (!shouldBackfillProgress(row)) continue;

    const key = sessionKey(row.userId, row.problemId);

    if (!sessionsByKey.has(key)) {
      tempCounter += 1;
      sessionsByKey.set(key, {
        tempId: `temp-${tempCounter}`,
        userId: row.userId,
        problemId: row.problemId,
        status: mapProgressStatusToSessionStatus(row.status),
        attemptNumber: Math.max(row.totalAttempts, 1),
        startedAt: row.startedAt ?? row.createdAt,
        completedAt:
          row.status === 'COMPLETED'
            ? (row.lastAttemptAt ?? undefined)
            : undefined,
        finalScore: row.lastScore ?? undefined,
        isTimerRunning: true,
        totalPausedSeconds: 0,
      });
    }

    const session = sessionsByKey.get(key)!;
    progressUpdates.push({
      progressId: row.id,
      sessionTempId: session.tempId,
      setActiveSession:
        row.status === 'IN_PROGRESS' || row.status === 'REVIEW_NEEDED',
      totalAttempts: Math.max(row.totalAttempts, 1),
    });
  }

  const submissionsByKey = new Map<string, BackfillSubmissionRow[]>();
  for (const sub of submissionRows) {
    const key = sessionKey(sub.userId, sub.problemId);
    const list = submissionsByKey.get(key) ?? [];
    list.push(sub);
    submissionsByKey.set(key, list);
  }

  for (const [key, subs] of submissionsByKey) {
    if (!sessionsByKey.has(key)) {
      tempCounter += 1;
      const [userId, problemId] = key.split(':');
      const timestamps = subs
        .map((s) => s.createdAt?.getTime())
        .filter((t): t is number => t != null);

      sessionsByKey.set(key, {
        tempId: `temp-${tempCounter}`,
        userId,
        problemId,
        status: 'COMPLETED',
        attemptNumber: 1,
        startedAt:
          timestamps.length > 0
            ? new Date(Math.min(...timestamps))
            : new Date(),
        completedAt:
          timestamps.length > 0
            ? new Date(Math.max(...timestamps))
            : undefined,
        isTimerRunning: true,
        totalPausedSeconds: 0,
      });
    }

    const session = sessionsByKey.get(key)!;
    for (const sub of subs) {
      submissionUpdates.push({
        submissionId: sub.id,
        sessionTempId: session.tempId,
      });
    }
  }

  return {
    sessions: [...sessionsByKey.values()],
    progressUpdates,
    submissionUpdates,
  };
}
