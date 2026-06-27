import { describe, expect, it } from 'vitest';
import { categorizeRecommendations, pickSecondaryRecommendation } from '../recommendations-logic';

const p = (slug: string, score: number, status?: string) => ({
  problem: { id: slug, slug },
  score,
  status,
});

describe('categorizeRecommendations', () => {
  it('excludes daily pick from needsReview', () => {
    const valid = [
      p('twitter', 520, 'REVIEW_NEEDED'),
      p('instagram', 210, 'IN_PROGRESS'),
      p('uber', 10),
    ];

    const { dailyPick, needsReview, recommended } = categorizeRecommendations(valid);

    expect(dailyPick?.problem.slug).toBe('twitter');
    expect(needsReview.map((r) => r.problem.slug)).toEqual(['instagram']);
    expect(recommended.map((r) => r.problem.slug)).toEqual(['uber']);
  });

  it('does not duplicate daily pick in recommended', () => {
    const valid = [p('tinyurl', 15), p('pastebin', 12)];

    const { dailyPick, recommended } = categorizeRecommendations(valid);

    expect(dailyPick?.problem.slug).toBe('tinyurl');
    expect(recommended.map((r) => r.problem.slug)).toEqual(['pastebin']);
  });
});

describe('pickSecondaryRecommendation', () => {
  it('skips daily pick when it also appears in needsReview', () => {
    const daily = { id: 'twitter', slug: 'design-twitter' };
    const needsReview = [{ id: 'twitter', slug: 'design-twitter' }, { id: 'uber', slug: 'design-uber' }];
    const recommended = [{ id: 'netflix', slug: 'design-netflix' }];

    const result = pickSecondaryRecommendation(daily, needsReview, recommended);

    expect(result?.problem.slug).toBe('design-uber');
    expect(result?.isReview).toBe(true);
  });
});
