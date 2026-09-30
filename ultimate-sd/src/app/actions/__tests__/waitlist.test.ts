// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { waitlistRateLimiter } from '@/lib/ratelimit';

// Mock dependencies
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/ratelimit', () => ({
  waitlistRateLimiter: {
    limit: vi.fn(),
  },
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks request if rate limit exceeded', async () => {
    vi.mocked(waitlistRateLimiter.limit).mockResolvedValueOnce({ success: false } as any);

    const result = await joinWaitlist('test@example.com');

    expect(waitlistRateLimiter.limit).toHaveBeenCalledWith('127.0.0.1');
    expect(result).toEqual({ success: false, error: 'Too many requests. Please try again later.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('allows request if rate limit ok', async () => {
    vi.mocked(waitlistRateLimiter.limit).mockResolvedValueOnce({ success: true } as any);
    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValueOnce({} as any);

    const result = await joinWaitlist('test@example.com');

    expect(waitlistRateLimiter.limit).toHaveBeenCalledWith('127.0.0.1');
    expect(result).toEqual({ success: true });
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: 'test@example.com' }
    }));
  });

  it('returns error on invalid email', async () => {
    vi.mocked(waitlistRateLimiter.limit).mockResolvedValueOnce({ success: true } as any);

    const result = await joinWaitlist('invalid-email');

    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
