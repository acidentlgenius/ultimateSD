import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@upstash/ratelimit', () => {
  const MockRatelimit = vi.fn(function(this: any) {
    this.limit = vi.fn().mockResolvedValue({ success: true });
  });
  Object.assign(MockRatelimit, {
    slidingWindow: vi.fn(),
  });
  return { Ratelimit: MockRatelimit };
});

vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn(),
  };
});

describe('ratelimit', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('degrades gracefully when no env vars are set', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { checkRateLimit } = await import('../ratelimit');
    const result = await checkRateLimit('127.0.0.1');

    expect(result.success).toBe(true);
  });

  it('works when env vars are set', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    const { checkRateLimit } = await import('../ratelimit');
    const result = await checkRateLimit('127.0.0.1');

    expect(result.success).toBe(true);
  });
});
