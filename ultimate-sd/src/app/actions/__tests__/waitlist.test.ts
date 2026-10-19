import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { joinWaitlist } from '../waitlist';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

const mockLimit = vi.fn();

vi.mock('@upstash/ratelimit', () => {
  const MockRatelimit = vi.fn(function(this: any) {
    this.limit = mockLimit;
  });
  Object.assign(MockRatelimit, { slidingWindow: vi.fn() });
  return { Ratelimit: MockRatelimit };
});

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));

describe('joinWaitlist', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
        ...originalEnv,
        UPSTASH_REDIS_REST_URL: 'http://localhost:8080',
        UPSTASH_REDIS_REST_TOKEN: 'token'
    };

    // Need to re-require to trigger env check, since we are setting it here
    vi.resetModules();

    mockLimit.mockResolvedValue({ success: true });
    vi.mocked(headers).mockResolvedValue(new Headers() as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('validates email correctly', async () => {
    const { joinWaitlist } = await import('../waitlist');
    const res = await joinWaitlist('invalid-email');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Please enter a valid email address.');
  });

  it('allows signup when rate limit succeeds', async () => {
    const { joinWaitlist } = await import('../waitlist');
    const res = await joinWaitlist('test@example.com');
    expect(res.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();
  });

  it('blocks signup when rate limit fails', async () => {
    mockLimit.mockResolvedValue({ success: false });
    const { joinWaitlist } = await import('../waitlist');
    const res = await joinWaitlist('test@example.com');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Too many requests. Please try again later.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('fails open if rate limiter throws', async () => {
    mockLimit.mockRejectedValue(new Error('Redis is down'));
    // Supress console.error in test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { joinWaitlist } = await import('../waitlist');
    const res = await joinWaitlist('test@example.com');

    expect(res.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
