import { PROBLEMS, getProblemBySlug } from '@/lib/problems';
import { FREE_PROBLEM_SLUGS } from '@/lib/plans';
import { SystemDesignProblem } from '@/types';

// Curated beginner track. Every slug must be in FREE_PROBLEM_SLUGS —
// a beginner path that hits a paywall on step 2 defeats its purpose.
export const START_HERE_TRACK = [
  'design-tinyurl',
  'design-parking-lot',
  'design-elevator-system',
  'design-typeahead-suggestion',
  'design-dropbox',
] as const;

export function getStartHereProblems(): SystemDesignProblem[] {
  return START_HERE_TRACK
    .map(slug => getProblemBySlug(slug))
    .filter((p): p is SystemDesignProblem => Boolean(p));
}

// Recommendation for the post-completion "Up next" CTA.
// Track order wins; otherwise fall back to a free problem the user hasn't just done.
export function getNextProblem(currentSlug: string): SystemDesignProblem | undefined {
  const trackIndex = START_HERE_TRACK.indexOf(currentSlug as typeof START_HERE_TRACK[number]);
  if (trackIndex !== -1 && trackIndex < START_HERE_TRACK.length - 1) {
    return getProblemBySlug(START_HERE_TRACK[trackIndex + 1]);
  }

  const current = getProblemBySlug(currentSlug);
  if (!current) {
    return getProblemBySlug(START_HERE_TRACK[0]);
  }

  const candidates = PROBLEMS.filter(p =>
    p.slug !== currentSlug &&
    (FREE_PROBLEM_SLUGS as readonly string[]).includes(p.slug)
  );
  return (
    candidates.find(p => p.category === current.category && p.difficulty === current.difficulty) ??
    candidates.find(p => p.category === current.category) ??
    candidates[0]
  );
}
