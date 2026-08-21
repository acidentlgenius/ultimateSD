import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows requests under the limit', () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 });
    try {
      expect(limiter.check('user1').success).toBe(true);
      expect(limiter.check('user1').success).toBe(true);
      expect(limiter.check('user1').success).toBe(true);
    } finally {
      limiter.destroy();
    }
  });

  it('blocks requests exceeding the limit', () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 2 });
    try {
      expect(limiter.check('user2').success).toBe(true);
      expect(limiter.check('user2').success).toBe(true);
      expect(limiter.check('user2').success).toBe(false);
      expect(limiter.check('user2').success).toBe(false);
    } finally {
      limiter.destroy();
    }
  });

  it('resets the limit after the window expires', () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });
    try {
      expect(limiter.check('user3').success).toBe(true);
      expect(limiter.check('user3').success).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(limiter.check('user3').success).toBe(true);
    } finally {
      limiter.destroy();
    }
  });

  it('cleans up expired entries periodically', () => {
    // The cleanup interval should run after 1 minute (60,000 ms) because the windowMs (1000) is very short,
    // and the minimum interval is 60_000.
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });
    try {
      limiter.check('user4');

      // Internal check to ensure it's in the store (using any since it's private)
      expect((limiter as any).store.has('user4')).toBe(true);

      // Advance time beyond the cleanup interval (60,000 ms)
      vi.advanceTimersByTime(60001);

      // Since we haven't checked again, the interval should have cleaned it up
      expect((limiter as any).store.has('user4')).toBe(false);
    } finally {
      limiter.destroy();
    }
  });

  it('does not clean up active entries', () => {
    const limiter = new RateLimiter({ windowMs: 100000, maxRequests: 1 });
    try {
      limiter.check('user5');

      // Advance time by 60s, the entry hasn't expired yet (expires in 100s)
      vi.advanceTimersByTime(60001);

      expect((limiter as any).store.has('user5')).toBe(true);
    } finally {
      limiter.destroy();
    }
  });
});
