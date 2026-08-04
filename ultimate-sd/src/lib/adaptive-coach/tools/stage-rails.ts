import type { ExperienceLevel, PracticeMode } from '@/lib/adaptive-coach/types';
import {
  getPracticeSteps,
  INTERVIEW_LITE_PHASE_STEPS,
} from '@/lib/interview-lite-steps';
import type { StepData, SystemDesignProblem } from '@/types';

export type CoachStage = {
  id: string;
  phaseKey: string;
  phase: string;
  title: string;
  prompt: string;
  budgetSec: number;
};

type Difficulty = SystemDesignProblem['difficulty'];

/**
 * Per-stage time budget heuristic:
 * - Base minutes by difficulty: Easy=6, Medium=8, Hard=10
 * - Level multiplier: fresher=1.2, sde1=1.0, sde2=0.9, senior=0.85
 * - Convert to seconds: baseMinutes × levelMultiplier × 60
 */
const BASE_MINUTES_BY_DIFFICULTY: Record<Difficulty, number> = {
  Easy: 6,
  Medium: 8,
  Hard: 10,
};

const LEVEL_MULTIPLIER: Record<ExperienceLevel, number> = {
  fresher: 1.2,
  sde1: 1.0,
  sde2: 0.9,
  senior: 0.85,
};

const SKIP_COMPETENCY_THRESHOLD = 0.8;

function stageBudgetSec(difficulty: Difficulty, level: ExperienceLevel): number {
  const baseMinutes = BASE_MINUTES_BY_DIFFICULTY[difficulty];
  const multiplier = LEVEL_MULTIPLIER[level];
  return Math.round(baseMinutes * multiplier * 60);
}

function flattenSteps(
  steps: Record<string, StepData[]>,
  budgetSec: number,
): CoachStage[] {
  const rails: CoachStage[] = [];

  for (const [phaseKey, phaseSteps] of Object.entries(steps)) {
    phaseSteps.forEach((step, index) => {
      rails.push({
        id: `${phaseKey}-${index}`,
        phaseKey,
        phase: step.phase,
        title: step.title,
        prompt: step.prompt,
        budgetSec,
      });
    });
  }

  return rails;
}

export function buildStageRails(
  slug: string,
  difficulty: Difficulty,
  level: ExperienceLevel,
  mode: PracticeMode,
  variant?: 'lite' | 'full',
): CoachStage[] {
  const budgetSec = stageBudgetSec(difficulty, level);

  const steps =
    mode === 'mock' && variant === 'lite'
      ? INTERVIEW_LITE_PHASE_STEPS
      : getPracticeSteps(slug, difficulty).steps;

  return flattenSteps(steps, budgetSec);
}

/** Practice-only caller: true when primary skillFocus competency is already high. */
export function canSkipStage(
  _level: ExperienceLevel,
  competencyEarned: number,
): boolean {
  return competencyEarned >= SKIP_COMPETENCY_THRESHOLD;
}
