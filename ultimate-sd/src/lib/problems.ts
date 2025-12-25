import { PROBLEMS as LIST } from './problems-list';
import { STEPS_REGISTRY } from './problem-steps';
import { SystemDesignProblem } from '@/types';

// Re-export constants for backward compatibility (internal usage mainly)
export * from './problem-steps';

export const PROBLEMS: SystemDesignProblem[] = LIST.map(p => ({
  ...p,
  steps: STEPS_REGISTRY[p.id]
}));
