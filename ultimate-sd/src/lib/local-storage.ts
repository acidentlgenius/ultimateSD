/**
 * Local Storage Utilities
 *
 * Provides safe wrappers for localStorage operations to prevent crashes
 * from corrupted data.
 */

export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}". Removing corrupted data.`, error);
    localStorage.removeItem(key);
    return defaultValue;
  }
}
