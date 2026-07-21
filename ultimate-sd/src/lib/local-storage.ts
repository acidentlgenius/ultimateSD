let isAvailable: boolean | null = null;

export function isLocalStorageAvailable(): boolean {
  if (isAvailable !== null) {
    return isAvailable;
  }
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    isAvailable = true;
  } catch (e) {
    isAvailable = false;
  }
  return isAvailable;
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (!isLocalStorageAvailable()) {
    return fallback;
  }
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    localStorage.removeItem(key);
    return fallback;
  }
}
