import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, _resetRateLimitCacheForTesting } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetRateLimitCacheForTesting();
  });

  afterEach(() => {
    _resetRateLimitCacheForTesting();
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const key = 'test-ip-1';
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('blocks requests over the limit', () => {
    const key = 'test-ip-2';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }
    const blockedResult = checkRateLimit(key, 5, 60000);
    expect(blockedResult.success).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  });

  it('resets the limit after the time window expires', () => {
    const key = 'test-ip-3';
    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }

    // Verify it's blocked
    expect(checkRateLimit(key, 5, 60000).success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(60001);

    // Should be allowed again
    const result = checkRateLimit(key, 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('cleanup interval removes expired entries', () => {
    const key = 'test-ip-4';
    checkRateLimit(key, 5, 1000); // 1 second window

    // Advance time past the window and past the cleanup interval (60s)
    vi.advanceTimersByTime(61000);

    // The entry should have been cleaned up (though we can only observe this by checking if it allows a new request)
    const result = checkRateLimit(key, 5, 1000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
