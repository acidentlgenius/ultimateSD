import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@upstash/ratelimit', async (importOriginal) => {
  const actual = await importOriginal<any>();
  class MockRatelimit {
    static slidingWindow = vi.fn();
    limit = vi.fn().mockResolvedValue({ success: true });
  }
  return {
    ...actual,
    Ratelimit: MockRatelimit
  };
});

vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn(),
  };
});

describe('rateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('allows request when UPSTASH env vars are not set', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    // Need to re-import because we conditionally initialize in the module scope
    const { rateLimit: rl } = await import('../ratelimit');

    const result = await rl('test_id');
    expect(result.success).toBe(true);
  });

  it('uses ratelimiter when UPSTASH env vars are set', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    // re-import
    const { rateLimit: rl } = await import('../ratelimit');

    const result = await rl('test_id');
    expect(result.success).toBe(true);
  });
});
