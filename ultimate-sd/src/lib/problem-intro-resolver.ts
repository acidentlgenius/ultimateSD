import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getStaticProblemIntro } from '@/lib/problem-intro';
import type { ProblemIntroContent, SystemDesignProblem } from '@/types';

const DbIntroSchema = z.object({
  hook: z.string().min(1),
  concepts: z.array(z.object({ term: z.string().min(1), blurb: z.string().min(1) })),
});

// Resolution order: admin-generated DB row > bespoke code > derived fallback.
// Any DB problem (missing table, malformed row, connection failure) falls
// through silently — the intro must never block a practice session from loading.
export async function getProblemIntro(
  problem: SystemDesignProblem
): Promise<ProblemIntroContent> {
  try {
    const row = await prisma.problemIntro.findUnique({
      where: { problemSlug: problem.slug },
    });
    if (row) {
      const parsed = DbIntroSchema.safeParse({ hook: row.hook, concepts: row.concepts });
      if (parsed.success) {
        return { ...parsed.data, source: 'generated' };
      }
      console.warn(`Malformed ProblemIntro row for ${problem.slug}; using static intro.`);
    }
  } catch (error) {
    console.warn(`ProblemIntro lookup failed for ${problem.slug}; using static intro.`, error);
  }
  return getStaticProblemIntro(problem);
}
