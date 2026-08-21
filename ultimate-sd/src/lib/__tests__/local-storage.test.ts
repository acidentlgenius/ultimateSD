import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { isStorageAvailable, safeLocalStorageGet } from '../local-storage';

describe('local-storage utilities', () => {
  beforeEach(() => {
    // Reset cache before each test
    vi.resetModules();
    localStorage.clear();
  });

  describe('safeLocalStorageGet', () => {
    it('returns parsed JSON when valid', async () => {
      // Re-import to ensure fresh cache
      const { safeLocalStorageGet } = await import('../local-storage');

      const testData = { a: 1, b: 'test' };
      localStorage.setItem('valid-key', JSON.stringify(testData));

      const result = safeLocalStorageGet('valid-key', { fallback: true });
      expect(result).toEqual(testData);
    });

    it('returns fallback and clears key when JSON is invalid', async () => {
      const { safeLocalStorageGet } = await import('../local-storage');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem('corrupt-key', 'not valid json');

      const result = safeLocalStorageGet('corrupt-key', { fallback: true });

      expect(result).toEqual({ fallback: true });
      expect(localStorage.getItem('corrupt-key')).toBeNull();

      consoleSpy.mockRestore();
    });

    it('returns fallback when key does not exist', async () => {
      const { safeLocalStorageGet } = await import('../local-storage');
      const result = safeLocalStorageGet('missing-key', 'my-fallback');
      expect(result).toBe('my-fallback');
    });
  });

  describe('isStorageAvailable caching', () => {
    it('caches the result of the first check', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const { isStorageAvailable } = await import('../local-storage');

      expect(isStorageAvailable()).toBe(true);
      expect(setItemSpy).toHaveBeenCalledTimes(1);

      // Call again, should not call setItem
      expect(isStorageAvailable()).toBe(true);
      expect(setItemSpy).toHaveBeenCalledTimes(1); // Still 1

      setItemSpy.mockRestore();
    });
  });
});
