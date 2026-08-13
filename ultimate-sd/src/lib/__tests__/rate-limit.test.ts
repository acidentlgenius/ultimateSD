import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InMemoryRateLimiter } from '../rate-limit';

describe('InMemoryRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows requests under the limit', () => {
    const limiter = new InMemoryRateLimiter(60000, 3);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(true);
    limiter.destroy();
  });

  it('blocks requests over the limit', () => {
    const limiter = new InMemoryRateLimiter(60000, 2);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(false); // 3rd request blocked
    limiter.destroy();
  });

  it('resets the limit after the window expires', () => {
    const limiter = new InMemoryRateLimiter(60000, 1);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(false); // blocked

    vi.advanceTimersByTime(60001); // advance past the window

    expect(limiter.checkLimit('user1')).toBe(true); // allowed again
    limiter.destroy();
  });

  it('cleans up expired entries', () => {
    const limiter = new InMemoryRateLimiter(60000, 1);
    limiter.checkLimit('user1');

    // Access private property for testing
    expect((limiter as any).store.size).toBe(1);

    vi.advanceTimersByTime(60001); // Past window
    // The cleanup interval should run (it runs every windowMs/2)
    // Wait for the setInterval to execute
    vi.advanceTimersByTime(60000);

    expect((limiter as any).store.size).toBe(0);
    limiter.destroy();
  });

  it('isolates different keys', () => {
    const limiter = new InMemoryRateLimiter(60000, 1);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user2')).toBe(true);

    expect(limiter.checkLimit('user1')).toBe(false);
    expect(limiter.checkLimit('user2')).toBe(false);
    limiter.destroy();
  });
});
