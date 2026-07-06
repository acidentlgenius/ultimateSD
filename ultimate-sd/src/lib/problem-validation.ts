import { z } from 'zod';
import type { SystemDesignProblem } from '@/types';
import { getStepsForProblem } from './problem-steps';
import { getGenericFallbackSteps, resolveEvaluationPhaseKey, resolvePhaseSteps } from './step-journey';

export const ProblemContentSchema = z.object({
  context: z
    .string()
    .min(40, 'context must be at least 40 characters (a real 2-3 sentence scenario, not a one-liner)'),
  functionalRequirements: z
    .array(z.string().min(15, 'functionalRequirements entries must be full phrases, not single buzzwords'))
    .min(1, 'functionalRequirements must have at least one entry'),
  nonFunctionalRequirements: z
    .array(z.string().min(15, 'nonFunctionalRequirements entries must be full phrases, not single buzzwords'))
    .min(1, 'nonFunctionalRequirements must have at least one entry'),
});

export interface ProblemValidationResult {
  slug: string;
  contentErrors: string[];
  missingPhases: Array<'HLD' | 'LLD'>;
}

export function validateProblem(problem: SystemDesignProblem): ProblemValidationResult {
  const contentResult = ProblemContentSchema.safeParse(problem);
  const contentErrors = contentResult.success
    ? []
    : contentResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);

  const resolvedSteps = resolvePhaseSteps(getStepsForProblem(problem.slug), getGenericFallbackSteps(problem));
  const resolvedPhaseTypes = new Set(
    Object.entries(resolvedSteps).map(([phaseKey, steps]) =>
      resolveEvaluationPhaseKey(phaseKey, steps[0]?.phase ?? '')
    )
  );

  const missingPhases: Array<'HLD' | 'LLD'> = [];
  if (!resolvedPhaseTypes.has('hld')) missingPhases.push('HLD');
  if (!resolvedPhaseTypes.has('lld')) missingPhases.push('LLD');

  return { slug: problem.slug, contentErrors, missingPhases };
}
