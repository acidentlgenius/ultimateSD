import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../fetchUtils';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should succeed on the first attempt', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'success' }) };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const promise = fetchWithRetry('/api/test');

    await expect(promise).resolves.toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'success' }) };
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse);

    const promise = fetchWithRetry('/api/test', { retries: 1, retryDelay: 100 });

    // Fast-forward timers for the retry delay
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    // To prevent unhandled promise rejections leaking, we attach a catch handler immediately
    const promise = fetchWithRetry('/api/test', { retries: 2, retryDelay: 100 });
    const catchPromise = promise.catch(() => {});

    // Fast-forward timers for the retries
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('Network error');
    await catchPromise;
    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should fail if response is not ok', async () => {
    const mockResponse = { ok: false, status: 500 };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const promise = fetchWithRetry('/api/test', { retries: 1, retryDelay: 100 });
    const catchPromise = promise.catch(() => {});

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('HTTP error! status: 500');
    await catchPromise;
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
