import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.check('ip1').allowed).toBe(true);
    expect(limiter.check('ip1').allowed).toBe(true);
  });

  it('blocks requests over the limit', () => {
    const limiter = new RateLimiter(2, 1000);
    limiter.check('ip1');
    limiter.check('ip1');
    expect(limiter.check('ip1').allowed).toBe(false);
  });

  it('resets after the window expires', () => {
    const limiter = new RateLimiter(2, 1000);
    limiter.check('ip1');
    limiter.check('ip1');
    expect(limiter.check('ip1').allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(limiter.check('ip1').allowed).toBe(true);
  });
});
