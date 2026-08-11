import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', () => {
    const limiter = new RateLimiter(5, 1000);
    expect(limiter.check('user1')).toBe(true);
    expect(limiter.check('user1')).toBe(true);
  });

  it('should reject requests exceeding limit', () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.check('user2')).toBe(true);
    expect(limiter.check('user2')).toBe(true);
    expect(limiter.check('user2')).toBe(false);
  });

  it('should refill tokens over time', () => {
    const limiter = new RateLimiter(2, 1000); // 2 tokens per 1000ms (1 token per 500ms)
    expect(limiter.check('user3')).toBe(true);
    expect(limiter.check('user3')).toBe(true);
    expect(limiter.check('user3')).toBe(false);

    vi.advanceTimersByTime(500); // Refill 1 token
    expect(limiter.check('user3')).toBe(true);
    expect(limiter.check('user3')).toBe(false);
  });

  it('should clean up stale entries', () => {
    const limiter = new RateLimiter(2, 1000);
    limiter.check('user4');

    // Fast forward 6 minutes to trigger cleanup
    vi.advanceTimersByTime(6 * 60 * 1000);

    // We can verify cleanup by checking internal state, but since it's private,
    // we test behavior: it should act as a fresh token bucket.
    expect(limiter.check('user4')).toBe(true);
  });
});