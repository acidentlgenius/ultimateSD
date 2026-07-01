import { prisma } from '../src/lib/prisma';
import { buildBackfillPlan } from './lib/backfill-progress';

async function main() {
  const existingCount = await prisma.practiceSession.count();
  if (existingCount > 0) {
    console.log(
      'PracticeSession rows already exist. Run `npx prisma migrate deploy` instead — migration SQL includes backfill.'
    );
    return;
  }

  const [progressRows, submissionRows] = await Promise.all([
    prisma.problemProgress.findMany(),
    prisma.stepSubmission.findMany({
      select: {
        id: true,
        userId: true,
        problemId: true,
        createdAt: true,
        sessionId: true,
      },
    }),
  ]);

  const unlinkedSubmissions = submissionRows.filter((s) => !s.sessionId);
  const plan = buildBackfillPlan(progressRows, unlinkedSubmissions);

  console.log(
    `Backfill plan: ${plan.sessions.length} sessions, ${plan.progressUpdates.length} progress updates, ${plan.submissionUpdates.length} submission links`
  );

  if (plan.sessions.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  const tempToRealId = new Map<string, string>();

  await prisma.$transaction(async (tx) => {
    for (const session of plan.sessions) {
      const created = await tx.practiceSession.create({
        data: {
          userId: session.userId,
          problemId: session.problemId,
          status: session.status,
          attemptNumber: session.attemptNumber,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          finalScore: session.finalScore,
          isTimerRunning: session.isTimerRunning,
          lastPausedAt: session.lastPausedAt,
          totalPausedSeconds: session.totalPausedSeconds,
        },
      });
      tempToRealId.set(session.tempId, created.id);
    }

    for (const update of plan.progressUpdates) {
      const sessionId = tempToRealId.get(update.sessionTempId);
      if (!sessionId) continue;

      await tx.problemProgress.update({
        where: { id: update.progressId },
        data: {
          totalAttempts: update.totalAttempts,
          ...(update.setActiveSession ? { activeSessionId: sessionId } : {}),
        },
      });
    }

    for (const update of plan.submissionUpdates) {
      const sessionId = tempToRealId.get(update.sessionTempId);
      if (!sessionId) continue;

      await tx.stepSubmission.update({
        where: { id: update.submissionId },
        data: { sessionId },
      });
    }
  });

  console.log('Backfill complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
