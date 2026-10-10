import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getRateLimiter } from '@/lib/ratelimit';
import { Ratelimit } from '@upstash/ratelimit';

vi.mock('@upstash/ratelimit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@upstash/ratelimit')>();
  const MockRatelimit = vi.fn(function(this: any) {
    this.limit = vi.fn();
  });
  return {
    ...actual,
    Ratelimit: Object.assign(MockRatelimit, {
      slidingWindow: vi.fn(),
    }),
  };
});
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));

describe('getRateLimiter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('returns null if env vars are missing', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(getRateLimiter()).toBeNull();
  });

  it('returns a Ratelimit instance if env vars are present', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    const limiter = getRateLimiter();
    expect(limiter).not.toBeNull();
    expect(Ratelimit).toHaveBeenCalled();
  });
});
