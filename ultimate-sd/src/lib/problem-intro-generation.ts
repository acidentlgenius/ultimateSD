import { z } from 'zod';
import type { ExpertSolution } from '@/lib/solutions';
import type { SystemDesignProblem } from '@/types';

export const GeneratedIntroSchema = z.object({
  hook: z.string().min(40).max(600),
  concepts: z
    .array(
      z.object({
        term: z.string().min(2).max(60),
        blurb: z.string().min(10).max(200),
      })
    )
    .min(2)
    .max(4),
});

export type GeneratedIntro = z.infer<typeof GeneratedIntroSchema>;

export function buildIntroGenerationPrompt(
  problem: SystemDesignProblem,
  solution: ExpertSolution | null
): string {
  const solutionContext = solution
    ? `\nExpert solution overview (use this to pick accurate concepts):\n${solution.overview}\nKey components: ${solution.components.map((c) => c.name).join(', ')}`
    : '';

  return `You write introductions for system design practice problems. Write an intro for the problem below.

Return ONLY a JSON object, no markdown, matching exactly:
{"hook": string, "concepts": [{"term": string, "blurb": string}, ...]}

Rules:
- hook: 2-4 vivid second-person sentences (40-600 chars) that drop the learner into a realistic engineering scenario for this problem. Include the scale numbers from the context. No headings, no lists.
- concepts: 2-4 entries. Each term is a core technique this problem exercises (e.g. "Consistent hashing"); each blurb is ONE plain-English sentence (10-200 chars) a beginner can follow.

Problem: ${problem.title}
Context: ${problem.context}
Functional requirements: ${problem.functionalRequirements.join('; ')}
Non-functional requirements: ${problem.nonFunctionalRequirements.join('; ')}
Tags: ${(problem.tags ?? []).join(', ')}
Difficulty: ${problem.difficulty}${solutionContext}`;
}

export function parseGeneratedIntro(raw: string): GeneratedIntro | null {
  const content = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const result = GeneratedIntroSchema.safeParse(JSON.parse(content));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
