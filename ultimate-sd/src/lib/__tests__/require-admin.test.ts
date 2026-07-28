import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } },
}));

import { requireAdmin } from '../require-admin';

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws Not authenticated when there is no session', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow('Not authenticated');
  });

  it('throws Not authorized when the user is not an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({ role: 'USER' });
    await expect(requireAdmin()).rejects.toThrow('Not authorized');
  });

  it('returns the user id when the user is an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFindUnique.mockResolvedValue({ role: 'ADMIN' });
    await expect(requireAdmin()).resolves.toBe('admin-1');
  });
});
