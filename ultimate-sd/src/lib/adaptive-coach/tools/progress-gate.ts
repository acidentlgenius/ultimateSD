import type { ExperienceLevel, GateDecision, PracticeMode } from '@/lib/adaptive-coach/types';

export type ProgressGateInput = {
  mode: PracticeMode;
  level: ExperienceLevel;
  score: number;
  attempts: number;
  stageElapsedSec: number;
  stageBudgetSec: number;
  sessionRemainingSec: number;
};

/** Spec §5.1 — practice · fresher/learn ≥5, sde1 ≥6, sde2/senior ≥7; mock fresher ≥6, sde1/sde2 ≥7, senior ≥8 */
const PASS_THRESHOLDS: Record<PracticeMode, Record<ExperienceLevel, number>> = {
  practice: {
    fresher: 5,
    sde1: 6,
    sde2: 7,
    senior: 7,
  },
  mock: {
    fresher: 6,
    sde1: 7,
    sde2: 7,
    senior: 8,
  },
};

/** Spec §5.1 — practice fresher/sde1: 3 tries; practice sde2/senior & all mock: 2 tries */
const MAX_ATTEMPTS: Record<PracticeMode, Record<ExperienceLevel, number>> = {
  practice: {
    fresher: 3,
    sde1: 3,
    sde2: 2,
    senior: 2,
  },
  mock: {
    fresher: 2,
    sde1: 2,
    sde2: 2,
    senior: 2,
  },
};

export function getPassThreshold(mode: PracticeMode, level: ExperienceLevel): number {
  return PASS_THRESHOLDS[mode][level];
}

export function getMaxAttempts(mode: PracticeMode, level: ExperienceLevel): number {
  return MAX_ATTEMPTS[mode][level];
}

function isTimerExhausted(input: ProgressGateInput): boolean {
  return input.sessionRemainingSec <= 0 || input.stageElapsedSec >= input.stageBudgetSec;
}

/**
 * Pure progress gate — decision order: end_mock → advance_budget → pass → retry → teach_forward.
 * Accuracy is not an input; callers must not use it for gating (spec §5.1).
 */
export function progressGate(input: ProgressGateInput): GateDecision {
  const threshold = getPassThreshold(input.mode, input.level);
  const maxAttempts = getMaxAttempts(input.mode, input.level);

  if (input.mode === 'mock' && isTimerExhausted(input)) {
    return {
      action: 'end_mock',
      reason: 'Mock session or stage timer exhausted',
    };
  }

  if (input.mode === 'practice' && input.stageElapsedSec >= input.stageBudgetSec) {
    return {
      action: 'advance_budget',
      reason: 'Stage time budget elapsed',
    };
  }

  if (input.score >= threshold) {
    return {
      action: 'pass',
      reason: `Score ${input.score} meets threshold ${threshold}`,
      threshold,
    };
  }

  if (input.attempts < maxAttempts) {
    return {
      action: 'retry',
      reason: `Score ${input.score} below threshold ${threshold}; attempts ${input.attempts}/${maxAttempts}`,
      threshold,
    };
  }

  return {
    action: 'teach_forward',
    reason: `Attempts exhausted (${input.attempts}/${maxAttempts}); score ${input.score} below threshold ${threshold}`,
    threshold,
    tipSkillId: 'teach-forward',
  };
}
