import { describe, it, expect } from 'vitest';
import {
  MOST_ASKED_COLLECTIONS,
  getProblemsForCollection,
  problemInCollection,
} from '../company-collections';

describe('company-collections', () => {
  it('defines curated lists for major companies', () => {
    const ids = MOST_ASKED_COLLECTIONS.map((c) => c.id);
    expect(ids).toContain('google');
    expect(ids).toContain('meta');
    expect(ids).toContain('amazon');
  });

  it('resolves problems for a collection in slug order', () => {
    const problems = getProblemsForCollection('google');
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]?.slug).toBe('design-tinyurl');
  });

  it('checks membership for filtering', () => {
    expect(problemInCollection('design-tinyurl', 'google')).toBe(true);
    expect(problemInCollection('design-parking-lot', 'google')).toBe(false);
  });
});
