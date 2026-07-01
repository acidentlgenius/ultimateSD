export interface ScoredProblem<T> {
  problem: T;
  score: number;
  status?: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Picks a daily recommendation from the top-scored pool, rotating by user + date. */
export function pickDailyPick<T extends { id?: string; slug: string }>(
  validProblems: ScoredProblem<T>[],
  seed: string
): ScoredProblem<T> | null {
  if (validProblems.length === 0) return null;

  const pool = validProblems.slice(0, Math.min(7, validProblems.length));
  return pool[hashString(seed) % pool.length];
}

export function categorizeRecommendations<T extends { id?: string; slug: string }>(
  validProblems: ScoredProblem<T>[],
  dailyPick: ScoredProblem<T> | null = validProblems[0] ?? null
) {
  const dailySlug = dailyPick?.problem.slug;

  const needsReview = validProblems
    .filter(
      (p) =>
        p.problem.slug !== dailySlug &&
        p.score > 200 &&
        p.status &&
        p.status !== 'NOT_STARTED'
    )
    .slice(0, 3);

  const needsReviewSlugs = new Set(needsReview.map((p) => p.problem.slug));
  const recommended = validProblems
    .filter((p) => p.problem.slug !== dailySlug && !needsReviewSlugs.has(p.problem.slug))
    .slice(0, 5);

  return { dailyPick, needsReview, recommended };
}

export function pickSecondaryRecommendation<T extends { id?: string; slug: string }>(
  dailyPick: T | null | undefined,
  needsReview: T[],
  recommended: T[]
): { problem: T; isReview: boolean } | null {
  const dailySlug = dailyPick?.slug;

  const reviewPick = needsReview.find((p) => p.slug !== dailySlug);
  if (reviewPick) {
    return { problem: reviewPick, isReview: true };
  }

  const generalPick = recommended.find((p) => p.slug !== dailySlug);
  if (generalPick) {
    return { problem: generalPick, isReview: false };
  }

  return null;
}
