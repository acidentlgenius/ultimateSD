import type { StepData } from '@/types';
import type { ForgeJourneyStep, FrameTheme } from './types';

const SUB_STEP_THEMES: Record<string, FrameTheme> = {
  functional: 'blue',
  core: 'blue',
  features: 'blue',
  problem: 'blue',
  'non-functional': 'purple',
  scale: 'purple',
  capacity: 'purple',
  constraints: 'purple',
  schema: 'green',
  'data-model': 'green',
  metadata: 'green',
  api: 'orange',
  architecture: 'red',
  diagram: 'red',
  hld: 'red',
  'high-level': 'red',
  components: 'slate',
  'data-flow': 'slate',
  decisions: 'slate',
  bottlenecks: 'slate',
  scaling: 'slate',
  encoding: 'green',
};

const DEFAULT_OBJECTIVES: Record<string, string[]> = {
  functional: ['Identify core user actions', 'Prioritize with P0/P1 labels', 'Stay in scope'],
  'non-functional': ['Quantify scale and latency', 'Tie NFRs to real numbers', 'Note trade-offs'],
  schema: ['Name key entities', 'Show relationships', 'Consider read/write patterns'],
  'data-model': ['Name key entities', 'Show relationships', 'Consider read/write patterns'],
  api: ['Define RESTful endpoints', 'Specify auth and errors', 'Keep surface minimal'],
  architecture: ['Draw major components', 'Show data flow', 'Identify bottlenecks'],
  decisions: ['State alternatives considered', 'Justify your choice', 'Acknowledge downsides'],
};

const DEFAULT_PITFALLS: Record<string, string[]> = {
  functional: ['Jumping to APIs before clarifying scope', 'Listing implementation details'],
  'non-functional': ['Vague targets like "fast" or "scalable"', 'Ignoring availability vs consistency'],
  schema: ['Over-normalizing too early', 'Missing hot-path entities'],
  'data-model': ['Over-normalizing too early', 'Missing hot-path entities'],
  api: ['Too many endpoints', 'Missing idempotency on writes'],
  architecture: ['Single point of failure', 'Skipping cache layer on read-heavy paths'],
  decisions: ['No alternative mentioned', 'Hand-waving without numbers'],
};

function themeForSubStep(subStep: string): FrameTheme {
  const normalized = subStep.toLowerCase().replace(/[\s_-]+/g, '-');
  return SUB_STEP_THEMES[normalized] ?? 'slate';
}

function idealMinutesForSubStep(subStep: string): [number, number] {
  const normalized = subStep.toLowerCase();
  if (normalized.includes('architecture') || normalized.includes('hld')) return [15, 25];
  if (normalized.includes('functional')) return [8, 15];
  if (normalized.includes('non-functional') || normalized.includes('scale')) return [10, 15];
  return [8, 12];
}

/** Flatten problem phase steps into a vertical forge journey. */
export function buildForgeJourney(phaseSteps: Record<string, StepData[]>): ForgeJourneyStep[] {
  const journey: ForgeJourneyStep[] = [];
  let stepIndex = 0;

  for (const [phaseKey, steps] of Object.entries(phaseSteps)) {
    for (const step of steps) {
      const subStep = step.subStep.toLowerCase();
      const stepId = `${phaseKey}-${subStep}`;
      journey.push({
        stepId,
        stepIndex,
        frameId: `frame-${stepId}`,
        title: step.title,
        phase: step.phase,
        phaseKey,
        subStep: step.subStep,
        theme: themeForSubStep(subStep),
        idealMinutes: idealMinutesForSubStep(subStep),
        objectives: DEFAULT_OBJECTIVES[subStep] ?? ['Complete this step thoughtfully', 'Be specific and quantitative'],
        pitfalls: DEFAULT_PITFALLS[subStep] ?? ['Rushing without structure', 'Copying generic answers'],
        prompt: step.prompt,
      });
      stepIndex += 1;
    }
  }

  return journey;
}

export function getJourneyProgress(completedStepIds: string[], totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((completedStepIds.length / totalSteps) * 100);
}

export function estimateMinutesRemaining(
  journey: ForgeJourneyStep[],
  activeStepIndex: number
): number {
  const remaining = journey.slice(activeStepIndex);
  if (remaining.length === 0) return 0;
  return remaining.reduce((sum, step) => sum + step.idealMinutes[1], 0);
}
