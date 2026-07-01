import { getStepsForProblem } from '@/lib/problem-steps';
import type {
  ParsedFeedback,
  PhaseSubmissionGroup,
  SessionDetail,
  StepSubmissionDetail,
} from '@/types';
import type { PracticeSession, StepSubmission } from '@prisma/client';

export function parseFeedback(raw: string | null): ParsedFeedback | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedFeedback;
  } catch {
    return null;
  }
}

export function formatPhaseLabel(phase: string): string {
  return phase
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function findStepTitle(slug: string, stepId: string): string {
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

type PracticeSessionWithSubmissions = PracticeSession & {
  submissions: StepSubmission[];
};

export function buildSessionDetail(
  practiceSession: PracticeSessionWithSubmissions,
  problemTitle: string,
  problemSlug: string
): SessionDetail {
  const submissionsByStep = new Map<string, StepSubmission[]>();
  for (const sub of practiceSession.submissions) {
    const list = submissionsByStep.get(sub.stepId) ?? [];
    list.push(sub);
    submissionsByStep.set(sub.stepId, list);
  }

  const phaseMap = new Map<string, StepSubmissionDetail[]>();
  const steps = getStepsForProblem(problemSlug);

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
      stepTitle: findStepTitle(problemSlug, stepId),
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
    problemTitle,
    problemSlug,
    status: practiceSession.status,
    startedAt: practiceSession.startedAt,
    completedAt: practiceSession.completedAt ?? undefined,
    finalScore: practiceSession.finalScore ?? undefined,
    attemptNumber: practiceSession.attemptNumber,
    diagramSnapshot: practiceSession.diagramSnapshot ?? undefined,
    phases,
  };
}
