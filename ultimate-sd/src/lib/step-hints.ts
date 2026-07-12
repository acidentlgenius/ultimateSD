import { isDiagramSubStep } from '@/lib/step-journey';
import type { StepData } from '@/types';

const INPUT_TYPE_HINTS: Record<StepData['inputType'], string> = {
  list: 'Add one idea per line — 4–6 items is okay.',
  textarea: 'Write your answer here — short bullets are fine.',
  schema: 'Add your tables or entities, then fill in their fields.',
};

const SCALE_SUB_STEPS = new Set(['non-functional', 'scale', 'capacity', 'constraints']);

// Diagram sub-steps return null: StepByStepChat already renders a dedicated
// canvas status indicator for them, and two instructions would compete.
export function getStepInteractionHint(step: StepData): string | null {
  if (step.interactionHint) return step.interactionHint;
  if (isDiagramSubStep(step.subStep)) return null;
  if (SCALE_SUB_STEPS.has(step.subStep.toLowerCase())) {
    return 'Rough numbers are fine — estimate how busy the system is and how much data it stores.';
  }
  return INPUT_TYPE_HINTS[step.inputType] ?? null;
}
