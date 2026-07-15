import type { ExperienceLevel } from '@/lib/adaptive-coach/types';

export const DEMO_PROBLEM_LABEL = 'TinyURL · Requirements';

/** Rough first draft — shown as the "you" bubble in every level. */
export const DEMO_YOU_ANSWER =
  'Users paste long links and get short codes. Need low latency redirects and basic analytics.';

export type DemoLevel = Extract<ExperienceLevel, 'fresher' | 'sde1' | 'senior'>;

export const DEMO_LEVELS = [
  { id: 'fresher' as const, label: 'Fresher' },
  { id: 'sde1' as const, label: 'SDE-1' },
  { id: 'senior' as const, label: 'Senior' },
] as const;

export type DemoBeatRole = 'system' | 'you' | 'coach';

export type DemoBeat = {
  id: string;
  /** Milliseconds after playback start when this beat becomes visible. */
  atMs: number;
  role: DemoBeatRole;
  body: string;
};

const SHARED: DemoBeat[] = [
  {
    id: 'sys-open',
    atMs: 300,
    role: 'system',
    body: 'Practice · TinyURL · Requirements',
  },
  {
    id: 'you-1',
    atMs: 1100,
    role: 'you',
    body: DEMO_YOU_ANSWER,
  },
  {
    id: 'coach-1',
    atMs: 3200,
    role: 'coach',
    body: 'Solid start — but you\'re blending what the product does with how well it has to run. Split functional needs from the performance bar.',
  },
];

const FRESHER_TAIL: DemoBeat[] = [
  {
    id: 'coach-fresher-pass',
    atMs: 6200,
    role: 'coach',
    body: 'For where you\'re aiming, that\'s enough to start. Lock three things the system must do, two how-well targets (latency, availability), then we\'ll sketch the data model.',
  },
  {
    id: 'sys-fresher-next',
    atMs: 9800,
    role: 'system',
    body: 'Moving on · Data model',
  },
];

const SDE1_TAIL: DemoBeat[] = [
  {
    id: 'you-sde1-2',
    atMs: 5600,
    role: 'you',
    body: 'Got it — functional: shorten and redirect. Non-functional: fast… and analytics?',
  },
  {
    id: 'coach-sde1-2',
    atMs: 8200,
    role: 'coach',
    body: 'Closer. Analytics is still a feature. Non-functional is how hard the redirect path has to work — latency, availability. Give me one concrete number.',
  },
  {
    id: 'you-sde1-3',
    atMs: 11200,
    role: 'you',
    body: 'Pretty fast? Like under a second?',
  },
  {
    id: 'coach-sde1-teach',
    atMs: 14200,
    role: 'coach',
    body: 'I\'ll unlock the next stage so we don\'t grind here — pick a redirect p99 (say under 100ms) and 99.9% availability, then defend those in the data model.',
  },
  {
    id: 'sys-sde1-next',
    atMs: 18500,
    role: 'system',
    body: 'Moving on · Data model',
  },
];

const SENIOR_TAIL: DemoBeat[] = [
  {
    id: 'coach-senior-probe',
    atMs: 5600,
    role: 'coach',
    body: 'That reads like a product blurb. At senior I need decisions: what\'s your redirect SLO, and what breaks first at 10× traffic?',
  },
  {
    id: 'you-senior-2',
    atMs: 9200,
    role: 'you',
    body: 'Redirects should be fast. We\'d scale the DB and add a cache if we need to.',
  },
  {
    id: 'coach-senior-teach',
    atMs: 12800,
    role: 'coach',
    body: 'Too hand-wavy to sit on. One move, then we advance: state a redirect p99 from the edge (e.g. under 50ms) and name the cache key plus cold-start path before you draw boxes.',
  },
  {
    id: 'sys-senior-next',
    atMs: 17500,
    role: 'system',
    body: 'Moving on · Data model',
  },
];

const SCRIPTS: Record<DemoLevel, DemoBeat[]> = {
  fresher: [...SHARED, ...FRESHER_TAIL],
  sde1: [...SHARED, ...SDE1_TAIL],
  senior: [...SHARED, ...SENIOR_TAIL],
};

/** Authored autoplay script for a level (shared opening, forked ending). */
export function getDemoScript(level: DemoLevel): DemoBeat[] {
  return SCRIPTS[level];
}

/** Beats that should be visible at `elapsedMs` (inclusive). */
export function visibleBeats(script: DemoBeat[], elapsedMs: number): DemoBeat[] {
  return script.filter((beat) => beat.atMs <= elapsedMs);
}

export function scriptDurationMs(script: DemoBeat[]): number {
  if (script.length === 0) return 0;
  return Math.max(...script.map((b) => b.atMs)) + 800;
}
