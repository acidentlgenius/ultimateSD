// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed'),
  },
}));

const mockRequest = (body: any) => ({
  json: async () => body,
} as Request);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/reset-password', () => {
  it('returns 400 if token or password is missing', async () => {
    const res = await POST(mockRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 if token is invalid', async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);
    const res = await POST(mockRequest({ token: 'invalid', password: 'new' }));
    expect(res.status).toBe(400);
  });

  it('updates password and verifies email if valid', async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: 'Test@example.com',
      token: 'valid',
      expires: new Date(Date.now() + 10000),
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-id',
    } as any);

    const res = await POST(mockRequest({ token: 'valid', password: 'new' }));

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Test@example.com', mode: 'insensitive' } },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-id' },
    }));

    expect(res.status).toBe(200);
  });

  it('returns 404 if user is not found', async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: 'Test@example.com',
      token: 'valid',
      expires: new Date(Date.now() + 10000),
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const res = await POST(mockRequest({ token: 'valid', password: 'new' }));

    expect(res.status).toBe(404);
  });
});
