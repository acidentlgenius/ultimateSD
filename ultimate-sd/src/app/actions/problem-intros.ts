'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { HumanMessage } from '@langchain/core/messages';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';
import { PROBLEMS } from '@/lib/problems';
import { getSolution } from '@/lib/solutions';
import { PROBLEM_INTROS } from '@/lib/problem-intros';
import {
  buildIntroGenerationPrompt,
  GeneratedIntroSchema,
  parseGeneratedIntro,
  type GeneratedIntro,
} from '@/lib/problem-intro-generation';

// Same guard shape as src/app/actions/feature-flags.ts — repo convention is a
// private copy per action file.
async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  return user.id;
}

export type ProblemIntroStatus = {
  slug: string;
  title: string;
  source: 'generated' | 'bespoke' | 'derived';
  updatedAt: string | null;
};

export async function listProblemIntroStatuses(): Promise<ProblemIntroStatus[]> {
  await requireAdmin();
  const rows = await prisma.problemIntro.findMany({
    select: { problemSlug: true, updatedAt: true },
  });
  const bySlug = new Map(rows.map((r) => [r.problemSlug, r.updatedAt.toISOString()]));
  return PROBLEMS.map((p) => ({
    slug: p.slug,
    title: p.title,
    source: bySlug.has(p.slug) ? 'generated' : PROBLEM_INTROS[p.slug] ? 'bespoke' : 'derived',
    updatedAt: bySlug.get(p.slug) ?? null,
  }));
}

export type GenerateIntroResult =
  | { ok: true; draft: GeneratedIntro }
  | { ok: false; error: 'ai_unavailable' | 'ai_rate_limited' | 'ai_failed'; message: string };

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status =
    (error as Error & { status?: number; code?: number }).status ??
    (error as Error & { status?: number; code?: number }).code;
  if (status === 429) return true;
  return /rate.?limit|429|quota|resource.?exhausted/i.test(error.message);
}

export async function generateProblemIntroDraft(slug: string): Promise<GenerateIntroResult> {
  const adminId = await requireAdmin();
  const problem = PROBLEMS.find((p) => p.slug === slug);
  if (!problem) {
    throw new Error(`Unknown problem: ${slug}`);
  }

  let llm;
  try {
    ({ llm } = await getUserLLM(adminId, { temperature: 0.7, problemSlug: slug }));
  } catch (error) {
    const message =
      error instanceof AIAccessError ? error.message : 'AI generation not available.';
    return { ok: false, error: 'ai_unavailable', message };
  }

  const prompt = buildIntroGenerationPrompt(problem, getSolution(slug));
  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    let draft = parseGeneratedIntro(response.content as string);
    if (!draft) {
      // One corrective retry, mirroring the evaluate route's pattern.
      const retry = await llm.invoke([
        new HumanMessage(
          `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object.`
        ),
      ]);
      draft = parseGeneratedIntro(retry.content as string);
    }
    if (!draft) {
      return {
        ok: false,
        error: 'ai_failed',
        message: 'The model returned malformed content twice. Try again.',
      };
    }
    return { ok: true, draft };
  } catch (error) {
    if (isRateLimitError(error)) {
      return {
        ok: false,
        error: 'ai_rate_limited',
        message: 'The AI provider is rate-limiting requests. Wait a moment and try again.',
      };
    }
    return {
      ok: false,
      error: 'ai_failed',
      message: 'Generation hit a temporary problem. Nothing was saved — try again.',
    };
  }
}

export async function saveProblemIntro(slug: string, draft: GeneratedIntro): Promise<void> {
  const adminId = await requireAdmin();
  const parsed = GeneratedIntroSchema.parse(draft);
  await prisma.problemIntro.upsert({
    where: { problemSlug: slug },
    update: { hook: parsed.hook, concepts: parsed.concepts },
    create: {
      problemSlug: slug,
      hook: parsed.hook,
      concepts: parsed.concepts,
      createdBy: adminId,
    },
  });
  revalidatePath('/admin');
  revalidatePath(`/practice/${slug}`);
}

export async function deleteProblemIntro(slug: string): Promise<void> {
  await requireAdmin();
  await prisma.problemIntro.deleteMany({ where: { problemSlug: slug } });
  revalidatePath('/admin');
  revalidatePath(`/practice/${slug}`);
}
