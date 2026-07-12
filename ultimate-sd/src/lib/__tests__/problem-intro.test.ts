import { describe, expect, it } from 'vitest';
import {
  buildFallbackIntro,
  getStaticProblemIntro,
  introSeenKey,
  INTRO_SUPPRESS_ALL_KEY,
  shouldAutoShowIntro,
  TAG_CONCEPTS,
} from '@/lib/problem-intro';
import { PROBLEM_INTROS } from '@/lib/problem-intros';
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
    expect(introSeenKey('design-tinyurl')).toBe('sd_problem_intro_seen_v2:design-tinyurl');
  });

  it('exposes a stable suppress-all key for e2e', () => {
    expect(INTRO_SUPPRESS_ALL_KEY).toBe('sd_problem_intro_suppress_all');
  });

  it('shouldAutoShowIntro respects suppress and seen keys', () => {
    localStorage.setItem(INTRO_SUPPRESS_ALL_KEY, '1');
    expect(shouldAutoShowIntro('design-tinyurl')).toBe(false);
    localStorage.removeItem(INTRO_SUPPRESS_ALL_KEY);

    localStorage.setItem(introSeenKey('design-tinyurl'), '1');
    expect(shouldAutoShowIntro('design-tinyurl')).toBe(false);
    localStorage.removeItem(introSeenKey('design-tinyurl'));

    expect(shouldAutoShowIntro('design-tinyurl')).toBe(true);
  });
});

describe('getStaticProblemIntro', () => {
  it('returns the bespoke intro with source=bespoke for pilot problems', () => {
    const tinyurl: SystemDesignProblem = { ...baseProblem, slug: 'design-tinyurl' };
    const intro = getStaticProblemIntro(tinyurl);
    expect(intro.source).toBe('bespoke');
    expect(intro.hook).toBe(PROBLEM_INTROS['design-tinyurl'].hook);
  });

  it('falls back to derived for non-pilot problems', () => {
    const intro = getStaticProblemIntro({ ...baseProblem, slug: 'design-nothing-here' });
    expect(intro.source).toBe('derived');
  });

  it('every bespoke intro meets the content standard', () => {
    for (const [slug, intro] of Object.entries(PROBLEM_INTROS)) {
      expect(intro.hook.length, `${slug} hook`).toBeGreaterThanOrEqual(100);
      expect(intro.concepts.length, `${slug} concepts`).toBeGreaterThanOrEqual(2);
      expect(intro.concepts.length, `${slug} concepts`).toBeLessThanOrEqual(4);
      for (const c of intro.concepts) {
        expect(c.term.length).toBeGreaterThan(1);
        expect(c.blurb.length).toBeGreaterThan(9);
      }
    }
  });
});
