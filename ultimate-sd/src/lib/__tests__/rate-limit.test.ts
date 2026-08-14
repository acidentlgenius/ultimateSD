import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under limit', () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.check('user1').success).toBe(true);
    expect(limiter.check('user1').success).toBe(true);
  });

  it('blocks requests over limit', () => {
    const limiter = new RateLimiter(2, 1000);
    limiter.check('user2');
    limiter.check('user2');
    expect(limiter.check('user2').success).toBe(false);
  });

  it('resets after window', () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check('user3').success).toBe(true);
    expect(limiter.check('user3').success).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(limiter.check('user3').success).toBe(true);
  });

  it('cleans up cache entries correctly', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.check('user4');

    // Check that interval started
    expect((limiter as any).cleanupInterval).not.toBeNull();

    // Move time forward past window
    vi.advanceTimersByTime(1001);

    // Interval runs, size becomes 0, interval cleared
    expect((limiter as any).cache.size).toBe(0);
    expect((limiter as any).cleanupInterval).toBeNull();
  });
});
