// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { resolveSessionUserId } from '@/lib/session-user';

const findUnique = vi.mocked(prisma.user.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveSessionUserId', () => {
  it('returns id when user exists by id', async () => {
    findUnique.mockResolvedValueOnce({ id: 'u1' } as never);
    await expect(
      resolveSessionUserId({ id: 'u1', email: 'a@b.com' })
    ).resolves.toBe('u1');
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { id: true },
    });
  });

  it('falls back to email when id is stale', async () => {
    findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'u-new' } as never);
    await expect(
      resolveSessionUserId({ id: 'stale', email: 'a@b.com' })
    ).resolves.toBe('u-new');
    expect(findUnique).toHaveBeenNthCalledWith(2, {
      where: { email: 'a@b.com' },
      select: { id: true },
    });
  });

  it('returns null when neither id nor email resolve', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      resolveSessionUserId({ id: 'gone', email: 'gone@b.com' })
    ).resolves.toBeNull();
  });
});
