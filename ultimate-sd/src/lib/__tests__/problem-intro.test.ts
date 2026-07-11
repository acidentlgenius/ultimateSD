import { describe, expect, it } from 'vitest';
import {
  buildFallbackIntro,
  introSeenKey,
  INTRO_SUPPRESS_ALL_KEY,
  TAG_CONCEPTS,
} from '@/lib/problem-intro';
import type { SystemDesignProblem } from '@/types';

const baseProblem: SystemDesignProblem = {
  id: '99',
  title: 'Design Example',
  slug: 'design-example',
  context: 'A startup serves 10M users and its monolith is falling over during peak traffic.',
  functionalRequirements: ['Serve requests'],
  nonFunctionalRequirements: ['99.9% availability'],
  difficulty: 'Medium',
  category: 'Core Services',
  companies: ['Acme'],
  tags: ['Caching', 'Scalability'],
};

describe('buildFallbackIntro', () => {
  it('builds a hook that carries the problem context verbatim', () => {
    const intro = buildFallbackIntro(baseProblem);
    expect(intro.hook).toContain(baseProblem.context);
    expect(intro.source).toBe('derived');
  });

  it('maps known tags to concepts', () => {
    const intro = buildFallbackIntro(baseProblem);
    expect(intro.concepts).toHaveLength(2);
    expect(intro.concepts[0]).toEqual(TAG_CONCEPTS['Caching']);
  });

  it('omits concepts entirely when fewer than 2 tags map', () => {
    const intro = buildFallbackIntro({ ...baseProblem, tags: ['Caching', 'Unknown Tag'] });
    expect(intro.concepts).toEqual([]);
  });

  it('handles problems with no tags', () => {
    const intro = buildFallbackIntro({ ...baseProblem, tags: undefined });
    expect(intro.concepts).toEqual([]);
    expect(intro.hook.length).toBeGreaterThan(0);
  });
});

describe('intro seen keys', () => {
  it('namespaces the seen key by slug', () => {
    expect(introSeenKey('design-tinyurl')).toBe('sd_problem_intro_seen_v1:design-tinyurl');
  });

  it('exposes a stable suppress-all key for e2e', () => {
    expect(INTRO_SUPPRESS_ALL_KEY).toBe('sd_problem_intro_suppress_all');
  });
});
