/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  getAllFilterTags,
  getProblemTags,
  problemMatchesTag,
  PROBLEM_TAG_IDS,
} from '@/lib/problem-tags';
import { PROBLEMS } from '@/lib/problems';

describe('problem-tags', () => {
  it('maps every catalog problem to curated tags', () => {
    for (const problem of PROBLEMS) {
      expect(PROBLEM_TAG_IDS[problem.slug], problem.slug).toBeDefined();
      const tags = getProblemTags(problem.slug);
      expect(tags.length).toBeGreaterThanOrEqual(2);
      expect(tags.length).toBeLessThanOrEqual(4);
    }
  });

  it('returns interview-specific tags for TinyURL', () => {
    const tags = getProblemTags('design-tinyurl');
    expect(tags.map((t) => t.id)).toEqual(
      expect.arrayContaining(['id-generation', 'hashing', 'caching'])
    );
    expect(tags.some((t) => t.label === 'System Design')).toBe(false);
  });

  it('filters problems by topic', () => {
    expect(problemMatchesTag('design-twitter', undefined, 'fan-out-on-write')).toBe(true);
    expect(problemMatchesTag('design-lru-cache', undefined, 'fan-out-on-write')).toBe(false);
  });

  it('builds unique sorted filter options', () => {
    const options = getAllFilterTags(PROBLEMS.slice(0, 10));
    const ids = options.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(options[0].label.localeCompare(options[options.length - 1].label)).toBeLessThanOrEqual(0);
  });
});
