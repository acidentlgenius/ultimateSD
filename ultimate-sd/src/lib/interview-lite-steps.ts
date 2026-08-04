import { getStepsForProblem } from '@/lib/problem-steps';
import { DEFAULT_PHASE_STEPS, GENERIC_OOD_PHASE_STEPS } from '@/lib/steps';
import { PROBLEM_TAG_IDS } from '@/lib/problem-tags';
import type { StepData, SystemDesignProblem } from '@/types';

/** Shorter interview flow for campus / 45-min rounds (clarify → estimate → HLD → trade-off). */
export const INTERVIEW_LITE_PHASE_STEPS: Record<string, StepData[]> = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Requirements',
      prompt:
        'List the core features users need. Keep it focused — what must the system do?',
      inputType: 'list',
      placeholder: 'e.g., Shorten a long URL to a compact link',
    },
    {
      phase: 'Requirements',
      subStep: 'non-functional',
      title: 'Scale & Constraints',
      prompt:
        'How busy will the system be? Estimate traffic, storage, and what matters most (speed, uptime, etc.).',
      inputType: 'textarea',
      placeholder: 'e.g., 100M links/day, mostly reads, redirects should feel instant',
    },
  ],
  hld: [
    {
      phase: 'HLD',
      subStep: 'api',
      title: 'API & Core Components',
      prompt:
        'Define the main APIs and 4–6 boxes in your architecture. How do clients interact with the system?',
      inputType: 'list',
      placeholder: 'e.g., POST /shorten, GET /{code} → redirect',
    },
    {
      phase: 'HLD',
      subStep: 'architecture',
      title: 'High-Level Architecture',
      prompt:
        'Describe (and draw) how components connect. Load balancer, app tier, database, cache — keep it interview-sized.',
      inputType: 'textarea',
      placeholder: 'Walk through the request path and major components...',
    },
  ],
  tradeoffs: [
    {
      phase: 'Trade-offs',
      subStep: 'decisions',
      title: 'Key Trade-off',
      prompt:
        'Pick one important design decision. What did you choose, what alternatives did you reject, and why?',
      inputType: 'textarea',
      placeholder: 'e.g., SQL vs NoSQL — chose SQL because...',
    },
  ],
};

export type PracticeStepMode = 'custom' | 'lite' | 'full';

export interface PracticeStepsResult {
  steps: Record<string, StepData[]>;
  mode: PracticeStepMode;
}

export function getPracticeSteps(
  slug: string,
  difficulty: SystemDesignProblem['difficulty'],
): PracticeStepsResult {
  const custom = getStepsForProblem(slug);
  if (custom) {
    return { steps: custom, mode: 'custom' };
  }
  if (PROBLEM_TAG_IDS[slug]?.includes('oop-design')) {
    return { steps: GENERIC_OOD_PHASE_STEPS, mode: 'full' };
  }
  if (difficulty === 'Easy') {
    return { steps: INTERVIEW_LITE_PHASE_STEPS, mode: 'lite' };
  }
  return { steps: DEFAULT_PHASE_STEPS, mode: 'full' };
}

export function countPracticeSteps(steps: Record<string, StepData[]>): number {
  return Object.values(steps).reduce((sum, phase) => sum + phase.length, 0);
}
