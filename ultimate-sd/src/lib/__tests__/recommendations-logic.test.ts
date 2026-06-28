import { describe, expect, it } from 'vitest';
import {
  categorizeRecommendations,
  pickDailyPick,
  pickSecondaryRecommendation,
} from '../recommendations-logic';

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

  it('excludes daily pick by slug when a custom daily pick is provided', () => {
    const valid = [p('tinyurl', 20), p('pastebin', 18), p('twitter', 12)];
    const customDaily = valid[1];

    const { dailyPick, needsReview, recommended } = categorizeRecommendations(valid, customDaily);

    expect(dailyPick?.problem.slug).toBe('pastebin');
    expect(needsReview.map((r) => r.problem.slug)).toEqual([]);
    expect(recommended.map((r) => r.problem.slug)).toEqual(['tinyurl', 'twitter']);
  });
});

describe('pickDailyPick', () => {
  it('rotates among top candidates using a stable seed', () => {
    const valid = [p('a', 30), p('b', 28), p('c', 26), p('d', 24)];

    const first = pickDailyPick(valid, 'user-1:2026-06-27');
    const second = pickDailyPick(valid, 'user-1:2026-06-27');
    const nextDay = pickDailyPick(valid, 'user-1:2026-06-28');

    expect(first?.problem.slug).toBe(second?.problem.slug);
    expect(['a', 'b', 'c', 'd']).toContain(first?.problem.slug);
    expect(nextDay?.problem.slug).not.toBe(first?.problem.slug);
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

  it('skips daily pick when ids differ but slug matches', () => {
    const daily = { id: '2', slug: 'design-youtube' };
    const needsReview = [{ id: 'design-youtube', slug: 'design-youtube' }];
    const recommended = [{ id: '3', slug: 'design-twitter' }];

    const result = pickSecondaryRecommendation(daily, needsReview, recommended);

    expect(result?.problem.slug).toBe('design-twitter');
    expect(result?.isReview).toBe(false);
  });
});
