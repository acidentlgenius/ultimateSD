import { vi } from 'vitest';


export const mockLimit = vi.fn().mockResolvedValue({ success: true });

vi.mock('@upstash/ratelimit', () => {
  const MockRatelimit = vi.fn(function(this: any) {
    this.limit = mockLimit;
  });
  Object.assign(MockRatelimit, {
    slidingWindow: vi.fn(),
  });
  return { Ratelimit: MockRatelimit, mockLimit };
});

vi.mock('@upstash/redis', () => {
  const MockRedis = vi.fn();
  return { Redis: MockRedis };
});
import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('dev@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.domain.co.in')).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@example.com')).toBe(false);
  });

  it('rejects overly long addresses', () => {
    expect(isValidEmail('a'.repeat(250) + '@example.com')).toBe(false);
    expect(isValidEmail('dev@example.com')).toBe(true);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Dev@Example.COM ')).toBe('dev@example.com');
  });
});

import { joinWaitlist } from '@/app/actions/waitlist';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));


describe('joinWaitlist', () => {
  it('returns false when rate limit is exceeded', async () => {
    // Actually, joinWaitlist is statically imported at the top of the file, which means it evaluates the global getRatelimit() *before* we can set the env vars in the test.
    // So the ratelimit is effectively `null` because process.env was empty at import time.
    // To fix this cleanly for a simple unit test, we should use dynamic imports with vi.resetModules().
  });
});

describe('joinWaitlist dynamic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns false when rate limit is exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = "test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test";

    const { mockLimit } = await import('@upstash/ratelimit');
    mockLimit.mockResolvedValueOnce({ success: false });

    const { joinWaitlist } = await import('@/app/actions/waitlist');
    const result = await joinWaitlist('test@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many requests. Please try again later.');
  });

  it('returns success when rate limit is not exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = "test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test";

    const { mockLimit } = await import('@upstash/ratelimit');
    mockLimit.mockResolvedValueOnce({ success: true });

    const { joinWaitlist } = await import('@/app/actions/waitlist');
    const result = await joinWaitlist('test@example.com');

    expect(result.success).toBe(true);
  });
});
