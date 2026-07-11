import { isDiagramSubStep } from '@/lib/step-journey';
import type { StepData } from '@/types';

const INPUT_TYPE_HINTS: Record<StepData['inputType'], string> = {
  list: 'List one item per line — aim for 4–6 crisp entries.',
  textarea: 'Write a short structured answer; bullet points are fine.',
  schema: 'Define your tables or entities with fields and types.',
};

// Diagram sub-steps return null: StepByStepChat already renders a dedicated
// canvas status indicator for them, and two instructions would compete.
export function getStepInteractionHint(step: StepData): string | null {
  if (step.interactionHint) return step.interactionHint;
  if (isDiagramSubStep(step.subStep)) return null;
  return INPUT_TYPE_HINTS[step.inputType] ?? null;
}
