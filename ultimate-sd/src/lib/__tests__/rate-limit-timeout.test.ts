import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limit';

describe('RateLimiter Timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('unrefs the interval so it doesnt block Node.js exit', () => {
    const unrefMock = vi.fn();

    // We mock setInterval to return an object with unref
    const originalSetInterval = global.setInterval;

    global.setInterval = vi.fn((fn, ms) => {
      return {
        unref: unrefMock,
        // Mock to make TypeScript happy, even though we just need unref
        ref: vi.fn(),
        hasRef: vi.fn(),
        refresh: vi.fn(),
        [Symbol.toPrimitive]: vi.fn(),
      } as any;
    }) as any;

    try {
      const limiter = new RateLimiter(1, 1000);
      limiter.check('test');

      expect(global.setInterval).toHaveBeenCalled();
      expect(unrefMock).toHaveBeenCalled();
    } finally {
      global.setInterval = originalSetInterval;
    }
  });
});
