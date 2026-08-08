import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { rateLimit, _resetRateLimitCacheForTesting } from '@/lib/rate-limit';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('rateLimit', () => {
  beforeEach(() => {
    _resetRateLimitCacheForTesting();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', async () => {
    const mockHeaders = new Map([['x-forwarded-for', '127.0.0.1']]);
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    const res1 = await rateLimit(2, 60000);
    expect(res1.success).toBe(true);

    const res2 = await rateLimit(2, 60000);
    expect(res2.success).toBe(true);
  });

  it('blocks requests over the limit', async () => {
    const mockHeaders = new Map([['x-forwarded-for', '127.0.0.1']]);
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    await rateLimit(2, 60000);
    await rateLimit(2, 60000);

    const res3 = await rateLimit(2, 60000);
    expect(res3.success).toBe(false);
  });

  it('resets after the window expires', async () => {
    const mockHeaders = new Map([['x-forwarded-for', '127.0.0.1']]);
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    await rateLimit(1, 60000);
    const res2 = await rateLimit(1, 60000);
    expect(res2.success).toBe(false);

    vi.advanceTimersByTime(60001);

    const res3 = await rateLimit(1, 60000);
    expect(res3.success).toBe(true);
  });

  it('handles multiple IPs independently', async () => {
    const mockHeaders1 = new Map([['x-forwarded-for', '192.168.1.1']]);
    const mockHeaders2 = new Map([['x-forwarded-for', '10.0.0.1']]);

    vi.mocked(headers).mockResolvedValueOnce(mockHeaders1 as any);
    await rateLimit(1, 60000);

    vi.mocked(headers).mockResolvedValueOnce(mockHeaders1 as any);
    const res1 = await rateLimit(1, 60000);
    expect(res1.success).toBe(false);

    vi.mocked(headers).mockResolvedValueOnce(mockHeaders2 as any);
    const res2 = await rateLimit(1, 60000);
    expect(res2.success).toBe(true);
  });
});
