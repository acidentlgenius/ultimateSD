/**
 * Shared Local Storage Utilities
 *
 * Provides safe access to browser localStorage, handling availability checks
 * and parsing errors to prevent UI crashes from corrupted data.
 */

let _isStorageAvailable: boolean | null = null;

/**
 * Check if localStorage is available and accessible (cached)
 */
export function isStorageAvailable(): boolean {
  if (_isStorageAvailable !== null) {
    return _isStorageAvailable;
  }

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    _isStorageAvailable = true;
    return true;
  } catch (e) {
    _isStorageAvailable = false;
    return false;
  }
}

/**
 * Safely parse JSON from localStorage, removing the key if parsing fails.
 *
 * @param key The localStorage key
 * @param fallback The default value to return if the key doesn't exist or parsing fails
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) {
    return fallback;
  }

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Failed to parse localStorage data for key ${key}. Removing corrupted data.`, error);
    localStorage.removeItem(key);
    return fallback;
  }
}
