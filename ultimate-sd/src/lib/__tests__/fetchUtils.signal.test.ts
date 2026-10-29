import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../fetchUtils';

describe('fetchWithRetry signal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('respects external AbortSignal and does not retry if external signal aborted', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'success' }) };
    let calls = 0;
    (global.fetch as any) = vi.fn().mockImplementation(async (url, options) => {
        calls++;
        return new Promise((resolve, reject) => {
            if (options.signal?.aborted) {
                return reject(new DOMException('Aborted', 'AbortError'));
            }
            options.signal?.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
            });
            setTimeout(() => resolve(mockResponse), 500);
        });
    });

    const controller = new AbortController();
    const promise = fetchWithRetry('/api/test', { signal: controller.signal });

    // simulate external abort immediately
    controller.abort();

    await expect(promise).rejects.toThrow('Aborted');
    expect(calls).toBe(1); // should not retry
  });

  it('retries on internal timeout', async () => {
    let calls = 0;
    (global.fetch as any) = vi.fn().mockImplementation(async (url, options) => {
        calls++;
        return new Promise((resolve, reject) => {
            options.signal?.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
            });
            // Never resolves
        });
    });

    // 1 retry, 100ms delay, 1000ms timeout
    const promise = fetchWithRetry('/api/test', { retries: 1, retryDelay: 100, timeout: 1000 });

    // Catch unhandled rejection
    const catchPromise = promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(1000); // Trigger timeout 1
    await vi.advanceTimersByTimeAsync(100);  // Delay before retry
    await vi.advanceTimersByTimeAsync(1000); // Trigger timeout 2 (retry)

    await expect(promise).rejects.toThrow('Aborted');
    await catchPromise;
    expect(calls).toBe(2);
  });
});
