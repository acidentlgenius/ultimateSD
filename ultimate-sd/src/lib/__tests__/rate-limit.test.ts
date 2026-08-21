import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, rateLimitCache, cleanupRateLimitCache } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    rateLimitCache.clear();
    vi.useFakeTimers();
  });

  it('allows requests under the limit', () => {
    expect(checkRateLimit('test-ip', 2, 1000)).toBe(true);
    expect(checkRateLimit('test-ip', 2, 1000)).toBe(true);
  });

  it('blocks requests over the limit', () => {
    expect(checkRateLimit('test-ip', 2, 1000)).toBe(true);
    expect(checkRateLimit('test-ip', 2, 1000)).toBe(true);
    expect(checkRateLimit('test-ip', 2, 1000)).toBe(false);
  });

  it('resets after the window', () => {
    expect(checkRateLimit('test-ip', 1, 1000)).toBe(true);
    expect(checkRateLimit('test-ip', 1, 1000)).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(checkRateLimit('test-ip', 1, 1000)).toBe(true);
  });

  it('cleans up expired entries', () => {
    checkRateLimit('test-ip-1', 1, 1000);
    checkRateLimit('test-ip-2', 1, 5000);

    vi.advanceTimersByTime(2000);
    cleanupRateLimitCache();

    expect(rateLimitCache.has('test-ip-1')).toBe(false);
    expect(rateLimitCache.has('test-ip-2')).toBe(true);
  });
});
