import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/user-llm', () => ({
  getUserLLM: vi.fn(),
  AIAccessError: class AIAccessError extends Error {},
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    problemIntro: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserLLM } from '@/lib/user-llm';
import {
  deleteProblemIntro,
  generateProblemIntroDraft,
  listProblemIntroStatuses,
  saveProblemIntro,
} from '@/app/actions/problem-intros';

const mockedAuth = vi.mocked(auth);
const mockedPrisma = vi.mocked(prisma, true);
const mockedGetUserLLM = vi.mocked(getUserLLM);

function asAdmin() {
  mockedAuth.mockResolvedValue({ user: { id: 'admin-1' } } as never);
  mockedPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as never);
}

function asNonAdmin() {
  mockedAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
  mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' } as never);
}

const validDraft = {
  hook: 'A hook that is comfortably longer than forty characters for validation.',
  concepts: [
    { term: 'Base62', blurb: 'Encode IDs as short strings.' },
    { term: 'Caching', blurb: 'Serve hot redirects from memory.' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin guard', () => {
  it('rejects non-admins on every action', async () => {
    asNonAdmin();
    await expect(listProblemIntroStatuses()).rejects.toThrow('Not authorized');
    await expect(generateProblemIntroDraft('design-tinyurl')).rejects.toThrow('Not authorized');
    await expect(saveProblemIntro('design-tinyurl', validDraft)).rejects.toThrow('Not authorized');
    await expect(deleteProblemIntro('design-tinyurl')).rejects.toThrow('Not authorized');
  });
});

describe('listProblemIntroStatuses', () => {
  it('classifies db > bespoke > derived', async () => {
    asAdmin();
    mockedPrisma.problemIntro.findMany.mockResolvedValue([
      { problemSlug: 'design-youtube', updatedAt: new Date('2026-07-12T00:00:00Z') },
    ] as never);
    const statuses = await listProblemIntroStatuses();
    const bySlug = new Map(statuses.map((s) => [s.slug, s]));
    expect(bySlug.get('design-youtube')?.source).toBe('generated');
    expect(bySlug.get('design-tinyurl')?.source).toBe('bespoke');
    const derived = statuses.find((s) => s.source === 'derived');
    expect(derived).toBeDefined();
  });
});

describe('generateProblemIntroDraft', () => {
  it('returns a validated draft on success', async () => {
    asAdmin();
    mockedGetUserLLM.mockResolvedValue({
      llm: { invoke: vi.fn().mockResolvedValue({ content: JSON.stringify(validDraft) }) },
    } as never);
    const result = await generateProblemIntroDraft('design-tinyurl');
    expect(result).toEqual({ ok: true, draft: validDraft });
  });

  it('returns ai_unavailable when LLM access fails', async () => {
    asAdmin();
    mockedGetUserLLM.mockRejectedValue(new Error('no key'));
    const result = await generateProblemIntroDraft('design-tinyurl');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ai_unavailable');
  });

  it('returns ai_failed when the model output never validates', async () => {
    asAdmin();
    mockedGetUserLLM.mockResolvedValue({
      llm: { invoke: vi.fn().mockResolvedValue({ content: 'garbage' }) },
    } as never);
    const result = await generateProblemIntroDraft('design-tinyurl');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ai_failed');
  });

  it('throws on unknown slugs', async () => {
    asAdmin();
    await expect(generateProblemIntroDraft('design-nope')).rejects.toThrow('Unknown problem');
  });
});

describe('saveProblemIntro', () => {
  it('validates and upserts', async () => {
    asAdmin();
    await saveProblemIntro('design-tinyurl', validDraft);
    expect(mockedPrisma.problemIntro.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { problemSlug: 'design-tinyurl' } })
    );
  });

  it('rejects invalid drafts', async () => {
    asAdmin();
    await expect(
      saveProblemIntro('design-tinyurl', { hook: 'short', concepts: [] } as never)
    ).rejects.toThrow();
    expect(mockedPrisma.problemIntro.upsert).not.toHaveBeenCalled();
  });
});

describe('deleteProblemIntro', () => {
  it('deletes the row', async () => {
    asAdmin();
    await deleteProblemIntro('design-tinyurl');
    expect(mockedPrisma.problemIntro.deleteMany).toHaveBeenCalledWith({
      where: { problemSlug: 'design-tinyurl' },
    });
  });
});
