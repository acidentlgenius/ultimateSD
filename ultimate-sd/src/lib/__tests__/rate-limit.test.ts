import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { rateLimit, _resetStorageCacheForTesting } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetStorageCacheForTesting();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within limit', () => {
    const result1 = rateLimit('ip-1');
    expect(result1.success).toBe(true);
  });

  it('blocks requests over limit', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('ip-2');
    }
    const result = rateLimit('ip-2');
    expect(result.success).toBe(false);
  });

  it('allows requests after window expires', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('ip-3');
    }
    vi.advanceTimersByTime(60000);
    const result = rateLimit('ip-3');
    expect(result.success).toBe(true);
  });
});
