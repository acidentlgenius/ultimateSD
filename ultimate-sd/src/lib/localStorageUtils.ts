/**
 * Local Storage Utility Functions
 *
 * Centralized functions for safely interacting with localStorage.
 * Handles parsing errors, quota exceeded errors, and SSR environments.
 */

/**
 * Check if localStorage is available and accessible
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Simply check if localStorage is defined, without doing a test write
    // which would fail if quota is exceeded (preventing reads/deletes)
    return !!window.localStorage;
  } catch (e) {
    return false;
  }
}

/**
 * Safely get and parse a JSON string from localStorage.
 * If the value is corrupted, it logs an error and optionally removes the key.
 */
export function safeGetJSON<T>(key: string, defaultValue: T | null = null, removeOnCorrupt = true): T | null {
  if (!isStorageAvailable()) return defaultValue;

  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;

  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Failed to parse JSON for key "${key}".`, error);
    if (removeOnCorrupt) {
      console.warn(`Removing corrupted data for key "${key}".`);
      localStorage.removeItem(key);
    }
    return defaultValue;
  }
}

/**
 * Safely stringify and set a JSON value in localStorage.
 * Catches QuotaExceededError and logs appropriately.
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  // We can't strictly use isStorageAvailable() here for quota checks
  // because isStorageAvailable() might return false if we mock setItem to throw.
  // Instead we'll rely on the try/catch.
  if (typeof window === 'undefined') return false;

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to save JSON to localStorage for key "${key}":`, error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded.');
    }
    return false;
  }
}

/**
 * Safely get a string value from localStorage.
 */
export function safeGetString(key: string, defaultValue: string | null = null): string | null {
  if (!isStorageAvailable()) return defaultValue;

  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch (error) {
    console.error(`Failed to get string from localStorage for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set a string value in localStorage.
 */
export function safeSetString(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to save string to localStorage for key "${key}":`, error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded.');
    }
    return false;
  }
}
