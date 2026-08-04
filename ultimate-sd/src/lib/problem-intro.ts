import type { ProblemIntroConcept, ProblemIntroContent, SystemDesignProblem } from '@/types';
import { PROBLEM_INTROS } from './problem-intros';

// The full tag vocabulary used across src/lib/problems.ts. 'System Design' is
// deliberately absent — it is too generic to yield a useful concept.
export const TAG_CONCEPTS: Record<string, ProblemIntroConcept> = {
  Caching: {
    term: 'Caching',
    blurb: 'Keep hot data in fast storage so repeated reads skip the database entirely.',
  },
  'Data Engineering': {
    term: 'Data pipelines',
    blurb: 'Move and transform large volumes of data reliably between systems.',
  },
  'Distributed Systems': {
    term: 'Distributed coordination',
    blurb: 'Many machines acting as one — expect partial failures and design for them.',
  },
  'Real-time': {
    term: 'Real-time delivery',
    blurb: 'Push updates to clients in milliseconds with sockets or streams instead of polling.',
  },
  Scalability: {
    term: 'Horizontal scaling',
    blurb: 'Handle growth by adding machines — which forces sharding, load balancing, and stateless services.',
  },
  Search: {
    term: 'Indexing & search',
    blurb: 'Precompute indexes so queries scan a handful of candidates, not the whole dataset.',
  },
};

export function buildFallbackIntro(problem: SystemDesignProblem): ProblemIntroContent {
  const mapped = (problem.tags ?? [])
    .map((tag) => TAG_CONCEPTS[tag])
    .filter((c): c is ProblemIntroConcept => Boolean(c));
  return {
    hook: `${problem.context} You're stepping into this as the engineer who has to make it work at scale — even if system design is new to you. We'll walk through it one decision at a time: what the system must do, how pieces connect, and where trade-offs matter.`,
    // A single concept reads as an afterthought — show the section only when
    // we have at least two, otherwise hide it rather than pad it.
    concepts: mapped.length >= 2 ? mapped : [],
    source: 'derived',
  };
}

// v2: inline first-step intro (replaces the old modal overlay's v1 key)
const INTRO_SEEN_KEY_PREFIX = 'sd_problem_intro_seen_v2:';

export function introSeenKey(slug: string): string {
  return `${INTRO_SEEN_KEY_PREFIX}${slug}`;
}

export function shouldAutoShowIntro(slug: string): boolean {
  try {
    if (localStorage.getItem(INTRO_SUPPRESS_ALL_KEY) === '1') return false;
    if (localStorage.getItem(introSeenKey(slug)) === '1') return false;
    return true;
  } catch {
    return false;
  }
}

// Set by e2e's suppressFirstRunUx so the overlay never auto-opens in specs
// that aren't about it. Also a manual escape hatch.
export const INTRO_SUPPRESS_ALL_KEY = 'sd_problem_intro_suppress_all';

export function getStaticProblemIntro(problem: SystemDesignProblem): ProblemIntroContent {
  const bespoke = PROBLEM_INTROS[problem.slug];
  if (bespoke) return { ...bespoke, source: 'bespoke' };
  return buildFallbackIntro(problem);
}
