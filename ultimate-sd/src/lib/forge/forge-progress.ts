import type { ForgeJourneyStep } from './types';

export function isForgeSessionComplete(
  completedStepIds: string[],
  journey: ForgeJourneyStep[]
): boolean {
  if (journey.length === 0) return false;
  return journey.every((step) => completedStepIds.includes(step.stepId));
}

export function averageStepScore(stepScores: Record<string, number>): number | null {
  const values = Object.values(stepScores);
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
