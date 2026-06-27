import type { ProgressStatus, SessionStatus } from '@/types';

type SessionLike = { status: SessionStatus };

export function countTotalSteps(steps: Record<string, unknown[]>): number {
  return Object.values(steps).reduce((sum, phaseSteps) => sum + phaseSteps.length, 0);
}

export function computeProgressPercent(completedStepIds: string[], totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((completedStepIds.length / totalSteps) * 100);
}

export function parseStepPhase(stepId: string): string {
  const lastDash = stepId.lastIndexOf('-');
  return lastDash === -1 ? stepId : stepId.slice(0, lastDash);
}

export function deriveDisplayStatus(
  input: {
    sessions: SessionLike[];
    summaryStatus: ProgressStatus;
    nextRepetitionDate?: Date | null;
  },
  now: Date = new Date()
): ProgressStatus {
  const hasCompleted = input.sessions.some((s) => s.status === 'COMPLETED');
  const hasActive = input.sessions.some((s) => s.status === 'ACTIVE');

  if (hasCompleted && input.summaryStatus === 'COMPLETED') {
    if (input.nextRepetitionDate && input.nextRepetitionDate <= now) {
      return 'REVIEW_NEEDED';
    }
    return 'COMPLETED';
  }
  if (hasActive || input.sessions.length > 0) {
    return 'IN_PROGRESS';
  }
  return 'NOT_STARTED';
}
