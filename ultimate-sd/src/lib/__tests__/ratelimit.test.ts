import { describe, it, expect, vi, beforeEach } from 'vitest';

// First, mock the dependencies before importing the module that uses them
vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      // Mock any Redis methods if necessary for future tests
    })),
  };
});

vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: vi.fn().mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({ success: true, pending: Promise.resolve() }),
    })),
  };
});

describe('ratelimit', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules(); // clears the cache
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('exports dummy ratelimiter when Upstash env vars are missing', async () => {
    // Ensure env vars are not set
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { waitlistRateLimit, redis } = await import('../ratelimit');

    expect(redis).toBeNull();
    const result = await waitlistRateLimit.limit('127.0.0.1');
    expect(result.success).toBe(true);
  });
});
