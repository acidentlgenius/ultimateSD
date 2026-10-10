import { describe, expect, it, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '@/app/actions/waitlist';
import { prisma } from '@/lib/prisma';
import * as ratelimitModule from '@/lib/ratelimit';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn().mockReturnValue('127.0.0.1'),
    })
  ),
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails if rate limited', async () => {
    vi.spyOn(ratelimitModule, 'getRateLimiter').mockReturnValue({
      limit: vi.fn().mockResolvedValue({ success: false }),
    } as any);

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many requests. Please try again later.');
  });

  it('succeeds if not rate limited and email is valid', async () => {
    vi.spyOn(ratelimitModule, 'getRateLimiter').mockReturnValue({
      limit: vi.fn().mockResolvedValue({ success: true }),
    } as any);
    (prisma.waitlistSignup.upsert as any).mockResolvedValue({});

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();
  });

  it('fails for invalid email', async () => {
    vi.spyOn(ratelimitModule, 'getRateLimiter').mockReturnValue({
      limit: vi.fn().mockResolvedValue({ success: true }),
    } as any);

    const result = await joinWaitlist('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
  });
});
