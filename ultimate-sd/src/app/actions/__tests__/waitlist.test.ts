import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { waitlistRateLimit } from '@/lib/ratelimit';

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map([['x-forwarded-for', '127.0.0.1']])),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

// Mock rate limit
vi.mock('@/lib/ratelimit', () => ({
  waitlistRateLimit: {
    limit: vi.fn(),
  },
}));

describe('joinWaitlist action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid emails without hitting DB', async () => {
    vi.mocked(waitlistRateLimit.limit).mockResolvedValue({ success: true } as any);

    const result = await joinWaitlist('not-an-email');
    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('upserts valid email successfully', async () => {
    vi.mocked(waitlistRateLimit.limit).mockResolvedValue({ success: true } as any);
    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({} as any);

    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: true });
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@example.com' },
      })
    );
  });

  it('returns rate limit error when limit is exceeded', async () => {
    vi.mocked(waitlistRateLimit.limit).mockResolvedValue({ success: false } as any);

    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: false, error: 'Too many requests. Please try again later.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
