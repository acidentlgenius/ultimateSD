import { PROBLEMS } from '@/lib/problems';
import type { RoadmapPhase, RoadmapStatus, RoadmapStep } from '@/components/roadmap/RoadmapTypes';
import type { ProblemWithStatus, ProgressStatus } from '@/types';

export function progressMapToSlugStatuses(
  progressByProblemId: Map<string, Partial<ProblemWithStatus>>
): Record<string, ProgressStatus> {
  const result: Record<string, ProgressStatus> = {};
  for (const problem of PROBLEMS) {
    const entry = progressByProblemId.get(problem.id);
    if (entry?.status) {
      result[problem.slug] = entry.status;
    }
  }
  return result;
}

function isProblemStepComplete(
  step: RoadmapStep,
  progressBySlug: Record<string, ProgressStatus>
): boolean {
  if (!step.problemSlug) {
    return step.status === 'completed';
  }
  const status = progressBySlug[step.problemSlug];
  return status === 'COMPLETED' || status === 'REVIEW_NEEDED';
}

function resolveStepStatus(
  step: RoadmapStep,
  progressBySlug: Record<string, ProgressStatus>,
  priorStepCompleted: boolean
): RoadmapStatus {
  if (!priorStepCompleted) {
    return 'locked';
  }

  if (!step.problemSlug) {
    return step.status === 'completed' ? 'completed' : 'unlocked';
  }

  const problemStatus = progressBySlug[step.problemSlug];
  if (problemStatus === 'COMPLETED' || problemStatus === 'REVIEW_NEEDED') {
    return 'completed';
  }
  if (problemStatus === 'IN_PROGRESS') {
    return 'in-progress';
  }
  return 'unlocked';
}

export function applyProgressToRoadmap(
  phases: RoadmapPhase[],
  progressBySlug: Record<string, ProgressStatus>
): RoadmapPhase[] {
  let priorStepCompleted = true;

  return phases.map((phase) => ({
    ...phase,
    steps: phase.steps.map((step) => {
      const status = resolveStepStatus(step, progressBySlug, priorStepCompleted);
      // Concept-only steps (no problemSlug) are informational: they never
      // block progression, so the unlock chain passes through unchanged.
      if (step.problemSlug) {
        priorStepCompleted = isProblemStepComplete(
          { ...step, status },
          progressBySlug
        );
      }
      return { ...step, status };
    }),
  }));
}
