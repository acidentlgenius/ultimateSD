import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ratelimit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('bypasses ratelimit if env vars are missing', async () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { checkRateLimit } = await import('../ratelimit');
    const result = await checkRateLimit('test-ip');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(0);

    if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });
});
