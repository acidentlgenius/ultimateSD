export interface ScoredProblem<T> {
  problem: T;
  score: number;
  status?: string;
}

export function categorizeRecommendations<T extends { id?: string; slug: string }>(
  validProblems: ScoredProblem<T>[]
) {
  const dailyPick = validProblems.length > 0 ? validProblems[0] : null;

  const needsReview = validProblems
    .filter(
      (p) =>
        p !== dailyPick &&
        p.score > 200 &&
        p.status &&
        p.status !== 'NOT_STARTED'
    )
    .slice(0, 3);

  const needsReviewSet = new Set(needsReview);
  const recommended = validProblems
    .filter((p) => p !== dailyPick && !needsReviewSet.has(p))
    .slice(0, 5);

  return { dailyPick, needsReview, recommended };
}

export function pickSecondaryRecommendation<T extends { id?: string }>(
  dailyPick: T | null | undefined,
  needsReview: T[],
  recommended: T[]
): { problem: T; isReview: boolean } | null {
  const dailyPickId = dailyPick?.id;

  const reviewPick = needsReview.find((p) => p.id !== dailyPickId);
  if (reviewPick) {
    return { problem: reviewPick, isReview: true };
  }

  const generalPick = recommended.find((p) => p.id !== dailyPickId);
  if (generalPick) {
    return { problem: generalPick, isReview: false };
  }

  return null;
}
