import { describe, expect, it } from 'vitest';
import {
  buildIntroGenerationPrompt,
  GeneratedIntroSchema,
  parseGeneratedIntro,
} from '@/lib/problem-intro-generation';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: '1',
  title: 'Design TinyURL',
  slug: 'design-tinyurl',
  context: 'Shorten billions of URLs.',
  functionalRequirements: ['Shorten URL', 'Redirect'],
  nonFunctionalRequirements: ['<100ms redirects'],
  difficulty: 'Easy',
  category: 'Basics',
  companies: ['Google'],
  tags: ['Caching'],
};

const validDraft = {
  hook: 'A hook that is comfortably longer than forty characters for validation.',
  concepts: [
    { term: 'Base62', blurb: 'Encode IDs as short strings.' },
    { term: 'Caching', blurb: 'Serve hot redirects from memory.' },
  ],
};

describe('buildIntroGenerationPrompt', () => {
  it('embeds the problem fields', () => {
    const prompt = buildIntroGenerationPrompt(problem, null);
    expect(prompt).toContain('Design TinyURL');
    expect(prompt).toContain('Shorten billions of URLs.');
    expect(prompt).toContain('Shorten URL');
    expect(prompt).toContain('<100ms redirects');
  });

  it('includes expert solution grounding when available', () => {
    const prompt = buildIntroGenerationPrompt(problem, {
      slug: 'design-tinyurl',
      title: 'TinyURL',
      overview: 'Counter-based key generation with cache-aside reads.',
      components: [{ name: 'Key Generation Service', description: 'd', technologies: [] }],
      dataFlow: [],
      tradeoffs: [],
    } as never);
    expect(prompt).toContain('Counter-based key generation');
    expect(prompt).toContain('Key Generation Service');
  });
});

describe('parseGeneratedIntro', () => {
  it('parses a clean JSON response', () => {
    expect(parseGeneratedIntro(JSON.stringify(validDraft))).toEqual(validDraft);
  });

  it('strips markdown code fences', () => {
    const fenced = '```json\n' + JSON.stringify(validDraft) + '\n```';
    expect(parseGeneratedIntro(fenced)).toEqual(validDraft);
  });

  it('rejects drafts that violate the schema', () => {
    expect(parseGeneratedIntro(JSON.stringify({ hook: 'too short', concepts: [] }))).toBeNull();
    expect(parseGeneratedIntro('not json at all')).toBeNull();
  });
});

describe('GeneratedIntroSchema', () => {
  it('enforces 2-4 concepts', () => {
    expect(GeneratedIntroSchema.safeParse(validDraft).success).toBe(true);
    expect(
      GeneratedIntroSchema.safeParse({ ...validDraft, concepts: validDraft.concepts.slice(0, 1) })
        .success
    ).toBe(false);
  });
});
