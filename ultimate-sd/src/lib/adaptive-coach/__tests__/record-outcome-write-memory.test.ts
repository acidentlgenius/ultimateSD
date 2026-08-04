// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockTransaction = vi.fn();
const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockCreateMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    coachMemoryNote: {
      createMany: (...args: unknown[]) => mockCreateMany(...args),
    },
  },
}));

import { recordOutcome } from '@/lib/adaptive-coach/tools/record-outcome';
import { writeMemoryNotes } from '@/lib/adaptive-coach/tools/write-memory';

describe('recordOutcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        competencySignal: {
          findUnique: mockFindUnique,
          upsert: mockUpsert,
        },
      };
      return fn(tx);
    });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({});
  });

  it('returns early when skillIds is empty', async () => {
    await recordOutcome({ userId: 'user-1', skillIds: [], outcome: 'earned' });

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('applies default delta 0.15 for earned', async () => {
    await recordOutcome({ userId: 'user-1', skillIds: ['caching'], outcome: 'earned' });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_skillId: { userId: 'user-1', skillId: 'caching' } },
      create: { userId: 'user-1', skillId: 'caching', earned: 0.15, coached: 0 },
      update: { earned: 0.15 },
    });
  });

  it('applies default delta 0.1 for coached', async () => {
    await recordOutcome({ userId: 'user-1', skillIds: ['caching'], outcome: 'coached' });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_skillId: { userId: 'user-1', skillId: 'caching' } },
      create: { userId: 'user-1', skillId: 'caching', earned: 0, coached: 0.1 },
      update: { coached: 0.1 },
    });
  });

  it('clamps earned value to 1 when delta would exceed', async () => {
    mockFindUnique.mockResolvedValue({ earned: 0.9, coached: 0 } as never);

    await recordOutcome({
      userId: 'user-1',
      skillIds: ['caching'],
      outcome: 'earned',
      delta: 0.15,
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_skillId: { userId: 'user-1', skillId: 'caching' } },
      create: { userId: 'user-1', skillId: 'caching', earned: 1, coached: 0 },
      update: { earned: 1 },
    });
  });

  it('clamps coached value to 1 when delta would exceed', async () => {
    mockFindUnique.mockResolvedValue({ earned: 0, coached: 0.95 } as never);

    await recordOutcome({
      userId: 'user-1',
      skillIds: ['caching'],
      outcome: 'coached',
      delta: 0.1,
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_skillId: { userId: 'user-1', skillId: 'caching' } },
      create: { userId: 'user-1', skillId: 'caching', earned: 0, coached: 1 },
      update: { coached: 1 },
    });
  });
});

describe('writeMemoryNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMany.mockResolvedValue({ count: 1 });
  });

  it('returns early when notes is empty', async () => {
    await writeMemoryNotes('user-1', []);

    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it('calls createMany with mapped notes', async () => {
    await writeMemoryNotes('user-1', [
      {
        text: 'Needs caching help',
        tags: ['caching'],
        problemSlug: 'design-tinyurl',
      },
    ]);

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 'user-1',
          text: 'Needs caching help',
          tags: ['caching'],
          problemSlug: 'design-tinyurl',
        },
      ],
    });
  });
});
