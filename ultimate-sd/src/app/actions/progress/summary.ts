'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { getStepsForProblem } from '@/lib/problem-steps';
import { deriveDisplayStatus } from '@/lib/progress-utils';
import type {
  ParsedFeedback,
  PhaseSubmissionGroup,
  ProblemWithStatus,
  SessionDetail,
  StepSubmissionDetail,
} from '@/types';

function parseFeedback(raw: string | null): ParsedFeedback | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedFeedback;
  } catch {
    return null;
  }
}

function formatPhaseLabel(phase: string): string {
  return phase
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function findStepTitle(slug: string, stepId: string): string {
  const steps = getStepsForProblem(slug);
  if (!steps) return stepId;

  for (const [phaseKey, phaseSteps] of Object.entries(steps)) {
    for (let i = 0; i < phaseSteps.length; i++) {
      if (`${phaseKey}-${i}` === stepId) {
        return phaseSteps[i].title;
      }
    }
  }

  return stepId;
}

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

  const submissionsByStep = new Map<string, typeof practiceSession.submissions>();
  for (const sub of practiceSession.submissions) {
    const list = submissionsByStep.get(sub.stepId) ?? [];
    list.push(sub);
    submissionsByStep.set(sub.stepId, list);
  }

  const phaseMap = new Map<string, StepSubmissionDetail[]>();
  const steps = getStepsForProblem(slug);

  if (steps) {
    for (const [phaseKey, phaseSteps] of Object.entries(steps)) {
      for (let i = 0; i < phaseSteps.length; i++) {
        const stepId = `${phaseKey}-${i}`;
        const attempts = submissionsByStep.get(stepId) ?? [];
        if (attempts.length === 0) continue;

        const stepDetail: StepSubmissionDetail = {
          stepId,
          stepTitle: phaseSteps[i].title,
          attempts: attempts.map((a) => ({
            id: a.id,
            content: a.content,
            feedback: parseFeedback(a.feedback),
            score: a.score,
            isPassing: a.isPassing,
            createdAt: a.createdAt,
          })),
        };

        const phaseStepsList = phaseMap.get(phaseKey) ?? [];
        phaseStepsList.push(stepDetail);
        phaseMap.set(phaseKey, phaseStepsList);
      }
    }
  }

  for (const [stepId, attempts] of submissionsByStep) {
    const alreadyIncluded = [...phaseMap.values()].some((stepsList) =>
      stepsList.some((s) => s.stepId === stepId)
    );
    if (alreadyIncluded) continue;

    const phase = attempts[0]?.phase ?? 'unknown';
    const stepDetail: StepSubmissionDetail = {
      stepId,
      stepTitle: findStepTitle(slug, stepId),
      attempts: attempts.map((a) => ({
        id: a.id,
        content: a.content,
        feedback: parseFeedback(a.feedback),
        score: a.score,
        isPassing: a.isPassing,
        createdAt: a.createdAt,
      })),
    };

    const phaseStepsList = phaseMap.get(phase) ?? [];
    phaseStepsList.push(stepDetail);
    phaseMap.set(phase, phaseStepsList);
  }

  const phases: PhaseSubmissionGroup[] = [...phaseMap.entries()].map(
    ([phase, stepsList]) => ({
      phase,
      phaseLabel: formatPhaseLabel(phase),
      steps: stepsList,
    })
  );

  return {
    id: practiceSession.id,
    problemTitle: problem?.title ?? 'Unknown Problem',
    problemSlug: slug,
    status: practiceSession.status,
    startedAt: practiceSession.startedAt,
    completedAt: practiceSession.completedAt ?? undefined,
    finalScore: practiceSession.finalScore ?? undefined,
    attemptNumber: practiceSession.attemptNumber,
    diagramSnapshot: practiceSession.diagramSnapshot ?? undefined,
    phases,
  };
}
