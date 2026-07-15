import type { ExperienceLevel, GateDecision } from '@/lib/adaptive-coach/types';
import {
  getMaxAttempts,
  getPassThreshold,
  progressGate,
} from '@/lib/adaptive-coach/tools/progress-gate';

export const DEMO_SCORE = 5 as const;
export const DEMO_PROBLEM_LABEL = 'TinyURL · Requirements';
export const DEMO_FAUX_ANSWER =
  'Users paste long links and get short codes. Need low latency redirects and basic analytics.';

export type DemoLevel = Extract<ExperienceLevel, 'fresher' | 'sde1' | 'senior'>;

export const DEMO_LEVELS = [
  { id: 'fresher' as const, label: 'Fresher' },
  { id: 'sde1' as const, label: 'SDE-1' },
  { id: 'senior' as const, label: 'Senior' },
];

export type DemoMessageKind = 'system' | 'pass' | 'retry' | 'teach_forward';

export type DemoMessage = {
  id: string;
  role: 'system' | 'coach';
  kind: DemoMessageKind;
  body: string;
};

export type LandingDemoState = {
  level: DemoLevel;
  attempts: number;
  done: boolean;
  lastAction: GateDecision['action'] | null;
  messages: DemoMessage[];
};

const OPENER: DemoMessage = {
  id: 'opener',
  role: 'system',
  kind: 'system',
  body: 'Same written answer every time (score 5). Watch how the coach judges it for your level.',
};

const NEXT_AGENDA = 'Next: Data model';

function coachCopy(
  action: GateDecision['action'],
  level: DemoLevel,
  attempts: number,
  maxAttempts: number
): { kind: DemoMessageKind; body: string } {
  if (action === 'pass') {
    return {
      kind: 'pass',
      body: `That meets the ${level} pass bar. Moving on — ${NEXT_AGENDA}.`,
    };
  }
  if (action === 'retry') {
    const left = maxAttempts - attempts;
    return {
      kind: 'retry',
      body: `Not quite at the ${level} bar yet. Separate functional needs (shorten / redirect) from non-functional ones (latency, scale). Try again — ${left} left.`,
    };
  }
  // teach_forward (and any unexpected non-pass path treated as coached tip for demo)
  return {
    kind: 'teach_forward',
    body: `Coached advance: lock three functional requirements (create short URL, redirect, optional click count) and two non-functional (p99 latency, availability) before designing. ${NEXT_AGENDA}.`,
  };
}

export function createInitialDemoState(level: DemoLevel = 'sde1'): LandingDemoState {
  return {
    level,
    attempts: 0,
    done: false,
    lastAction: null,
    messages: [OPENER],
  };
}

export function resetDemoState(level: DemoLevel): LandingDemoState {
  return createInitialDemoState(level);
}

export function getDemoStatus(
  level: DemoLevel,
  attempts: number,
  lastAction: GateDecision['action'] | null
) {
  return {
    mode: 'Practice' as const,
    threshold: getPassThreshold('practice', level),
    maxAttempts: getMaxAttempts('practice', level),
    attempts,
    lastAction,
  };
}

export function submitDemoAttempt(state: LandingDemoState): LandingDemoState {
  if (state.done) return state;

  const attempts = state.attempts + 1;
  const decision = progressGate({
    mode: 'practice',
    level: state.level,
    score: DEMO_SCORE,
    attempts,
    stageElapsedSec: 0,
    stageBudgetSec: 9999,
    sessionRemainingSec: 9999,
  });

  const maxAttempts = getMaxAttempts('practice', state.level);
  const copy = coachCopy(decision.action, state.level, attempts, maxAttempts);
  const done = decision.action === 'pass' || decision.action === 'teach_forward';

  return {
    ...state,
    attempts,
    done,
    lastAction: decision.action,
    messages: [
      ...state.messages,
      {
        id: `coach-${attempts}-${decision.action}`,
        role: 'coach',
        kind: copy.kind,
        body: copy.body,
      },
    ],
  };
}
