import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limit';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter = new RateLimiter(3, 10000); // 3 requests per 10 seconds
  });

  afterEach(() => {
    rateLimiter._resetForTesting();
    vi.useRealTimers();
  });

  it('allows requests up to the limit', () => {
    expect(rateLimiter.check('ip1')).toBe(true);
    expect(rateLimiter.check('ip1')).toBe(true);
    expect(rateLimiter.check('ip1')).toBe(true);
  });

  it('blocks requests over the limit', () => {
    rateLimiter.check('ip1');
    rateLimiter.check('ip1');
    rateLimiter.check('ip1');
    expect(rateLimiter.check('ip1')).toBe(false);
  });

  it('resets the limit after the window expires', () => {
    rateLimiter.check('ip1');
    rateLimiter.check('ip1');
    rateLimiter.check('ip1');
    expect(rateLimiter.check('ip1')).toBe(false);

    vi.advanceTimersByTime(10001);

    expect(rateLimiter.check('ip1')).toBe(true);
  });

  it('cleans up expired entries periodically', () => {
    rateLimiter.check('ip2');
    vi.advanceTimersByTime(60001); // Trigger cleanup
    // The entry should be removed from the underlying map.
    // We check via check() again.
    expect(rateLimiter.check('ip2')).toBe(true);
  });
});
