import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within limit', () => {
    const limiter = new RateLimiter(5, 60000);
    const key = 'user1';

    for (let i = 0; i < 5; i++) {
      const result = limiter.check(key);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }

    limiter.close();
  });

  it('rejects requests exceeding limit', () => {
    const limiter = new RateLimiter(2, 60000);
    const key = 'user2';

    limiter.check(key);
    limiter.check(key);
    const result = limiter.check(key);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);

    limiter.close();
  });

  it('resets counts after window expires', () => {
    const limiter = new RateLimiter(2, 1000);
    const key = 'user3';

    limiter.check(key);
    limiter.check(key);
    expect(limiter.check(key).success).toBe(false);

    vi.advanceTimersByTime(1001);

    const result = limiter.check(key);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);

    limiter.close();
  });

  it('cleans up expired entries periodically', () => {
    const windowMs = 1000;
    const limiter = new RateLimiter(5, windowMs);
    const key = 'user4';

    limiter.check(key);

    // Cleanup runs every Math.max(windowMs, 60000) = 60000ms
    vi.advanceTimersByTime(60001);

    // Private state access for testing
    const store = (limiter as any).store as Map<string, any>;
    expect(store.has(key)).toBe(false);

    limiter.close();
  });
});
