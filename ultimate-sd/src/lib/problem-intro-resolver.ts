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
      if (process.env.NODE_ENV !== 'test') console.warn(`Malformed ProblemIntro row for ${problem.slug}; using static intro.`);
    }
  } catch (error) {
    // SQUASH: Root Cause: Database connection errors when fetching optional problem intros throw loudly to stderr despite the safe fallback.
    // SQUASH: Fix: Catch standard network/database errors and suppress the stack trace to reduce noise, only logging the message in development.
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`ProblemIntro lookup failed for ${problem.slug}; using static intro.`, (error as Error)?.message || error);
    }
  }
  return getStaticProblemIntro(problem);
}
