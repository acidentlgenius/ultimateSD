import { StepData, SystemDesignProblem } from '@/types';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import { phaseIncludesDiagram as journeyPhaseIncludesDiagram } from '@/lib/step-journey';

export interface StepExportEntry {
  stepKey: string;
  stepTitle: string;
  data: Record<string, unknown>;
}

export interface PhaseExportGroup {
  phaseKey: string;
  phaseName: string;
  steps: StepExportEntry[];
}

export function parseStepKey(stepKey: string): { phaseKey: string; stepIndex: number } {
  const lastDash = stepKey.lastIndexOf('-');
  if (lastDash === -1) {
    return { phaseKey: stepKey, stepIndex: 0 };
  }

  return {
    phaseKey: stepKey.slice(0, lastDash),
    stepIndex: parseInt(stepKey.slice(lastDash + 1), 10) || 0,
  };
}

export function formatPhaseKey(phaseKey: string): string {
  return phaseKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveProblemSteps(
  problem: SystemDesignProblem
): Record<string, StepData[]> {
  return problem.steps ?? DEFAULT_PHASE_STEPS;
}

export function getStepTitle(
  phaseSteps: Record<string, StepData[]>,
  stepKey: string
): string {
  const { phaseKey, stepIndex } = parseStepKey(stepKey);
  return phaseSteps[phaseKey]?.[stepIndex]?.title ?? formatPhaseKey(stepKey);
}

export function buildPhaseExportGroups(
  problem: SystemDesignProblem,
  savedStepData: Map<string, Record<string, unknown>>
): PhaseExportGroup[] {
  const phaseSteps = resolveProblemSteps(problem);
  const phaseKeys = Object.keys(phaseSteps);

  return phaseKeys
    .map((phaseKey) => {
      const steps = [...savedStepData.entries()]
        .filter(([stepKey]) => parseStepKey(stepKey).phaseKey === phaseKey)
        .sort(
          ([a], [b]) => parseStepKey(a).stepIndex - parseStepKey(b).stepIndex
        )
        .map(([stepKey, data]) => ({
          stepKey,
          stepTitle: getStepTitle(phaseSteps, stepKey),
          data,
        }));

      if (steps.length === 0) {
        return null;
      }

      const phaseName = phaseSteps[phaseKey]?.[0]?.phase ?? formatPhaseKey(phaseKey);

      return { phaseKey, phaseName, steps };
    })
    .filter((group): group is PhaseExportGroup => group !== null);
}

export function phaseIncludesDiagram(phaseKey: string): boolean {
  return journeyPhaseIncludesDiagram(phaseKey);
}
