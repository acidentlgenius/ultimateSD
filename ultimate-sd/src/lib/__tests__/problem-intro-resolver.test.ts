import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    problemIntro: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { getProblemIntro } from '@/lib/problem-intro-resolver';
import { PROBLEM_INTROS } from '@/lib/problem-intros';
import type { SystemDesignProblem } from '@/types';

const mocked = vi.mocked(prisma, true);

const problem: SystemDesignProblem = {
  id: '1',
  title: 'Design TinyURL',
  slug: 'design-tinyurl',
  context: 'Shorten URLs at scale.',
  functionalRequirements: [],
  nonFunctionalRequirements: [],
  difficulty: 'Easy',
  category: 'Basics',
  companies: [],
  tags: ['Caching', 'Scalability'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getProblemIntro', () => {
  beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('prefers a valid DB row and stamps source=generated', async () => {
    mocked.problemIntro.findUnique.mockResolvedValue({
      id: 'x',
      problemSlug: 'design-tinyurl',
      hook: 'Admin-generated hook for this problem, long enough to be real.',
      concepts: [
        { term: 'A', blurb: 'First concept blurb.' },
        { term: 'B', blurb: 'Second concept blurb.' },
      ],
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    const intro = await getProblemIntro(problem);
    expect(intro.source).toBe('generated');
    expect(intro.hook).toContain('Admin-generated');
  });

  it('falls through to bespoke when the DB row is malformed', async () => {
    mocked.problemIntro.findUnique.mockResolvedValue({
      id: 'x',
      problemSlug: 'design-tinyurl',
      hook: '',
      concepts: 'not-an-array',
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    const intro = await getProblemIntro(problem);
    expect(intro.source).toBe('bespoke');
    expect(intro.hook).toBe(PROBLEM_INTROS['design-tinyurl'].hook);
  });

  it('falls through to static when there is no DB row', async () => {
    mocked.problemIntro.findUnique.mockResolvedValue(null as never);
    const intro = await getProblemIntro({ ...problem, slug: 'design-not-piloted' });
    expect(intro.source).toBe('derived');
  });

  it('never throws when the DB lookup fails', async () => {
    mocked.problemIntro.findUnique.mockRejectedValue(new Error('db down'));
    const intro = await getProblemIntro(problem);
    expect(intro.source).toBe('bespoke');
  });
});
