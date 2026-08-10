// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { emailFromVerificationIdentifier } from '@/lib/email';

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

vi.mock('@/lib/email', () => ({
  emailFromVerificationIdentifier: vi.fn(),
}));

vi.mock('@/lib/safe-redirect', () => ({
  safeCallbackPath: vi.fn().mockImplementation((path) => path),
}));

const mockRequest = (url: string) => ({
  url,
} as Request);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/auth/verify-email', () => {
  it('redirects with error if token is missing', async () => {
    const res = await GET(mockRequest('http://localhost/api/auth/verify-email'));
    expect(res.headers.get('location')).toContain('error=invalid_token');
  });

  it('redirects with error if user not found', async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: 'email-verify:Test@example.com',
      token: 'valid',
      expires: new Date(Date.now() + 10000),
    } as any);
    vi.mocked(emailFromVerificationIdentifier).mockReturnValue('Test@example.com');
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const res = await GET(mockRequest('http://localhost/api/auth/verify-email?token=valid'));
    expect(res.headers.get('location')).toContain('error=invalid_token');
  });

  it('updates emailVerified if valid', async () => {
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: 'email-verify:Test@example.com',
      token: 'valid',
      expires: new Date(Date.now() + 10000),
    } as any);
    vi.mocked(emailFromVerificationIdentifier).mockReturnValue('Test@example.com');
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-id',
    } as any);

    const res = await GET(mockRequest('http://localhost/api/auth/verify-email?token=valid'));

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Test@example.com', mode: 'insensitive' } },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-id' },
    }));

    expect(res.headers.get('location')).toContain('verified=1');
  });
});
