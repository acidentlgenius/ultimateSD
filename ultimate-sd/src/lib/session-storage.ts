/**
 * Local Storage Session Persistence
 * 
 * Provides utilities to save and restore practice session state
 * across page refreshes and browser sessions.
 */

interface SavedStepData {
  listItems: string[];
  textInput: string;
  schemaData: any[];
  feedback: any | null;
  completed: boolean;
  skipped?: boolean;
}

interface SessionState {
  currentPhase: string;
  currentStepIndex: number;
  savedStepData: Record<string, SavedStepData>;
  completedSteps: string[];
  lastUpdated: string;
}

const STORAGE_PREFIX = 'sd-practice-';
const STORAGE_VERSION = 'v1';

/**
 * Generate a unique storage key for a problem session
 */
function getStorageKey(problemSlug: string): string {
  return `${STORAGE_PREFIX}${STORAGE_VERSION}-${problemSlug}`;
}

let _storageAvailableCache: boolean | null = null;

export function _resetStorageCacheForTesting() {
  _storageAvailableCache = null;
}

/**
 * Check if localStorage is available and accessible
 */
function isStorageAvailable(): boolean {
  if (_storageAvailableCache !== null) {
    return _storageAvailableCache;
  }
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    _storageAvailableCache = true;
    return true;
  } catch (e) {
    _storageAvailableCache = false;
    return false;
  }
}

/**
 * Save session state to localStorage
 */
export function saveSessionState(
  problemSlug: string,
  state: {
    currentPhase: string;
    currentStepIndex: number;
    savedStepData: Map<string, SavedStepData>;
    completedSteps: Set<string>;
  }
): boolean {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available - session will not persist');
    return false;
  }

  try {
    const sessionState: SessionState = {
      currentPhase: state.currentPhase,
      currentStepIndex: state.currentStepIndex,
      savedStepData: Object.fromEntries(state.savedStepData),
      completedSteps: Array.from(state.completedSteps),
      lastUpdated: new Date().toISOString(),
    };

    const key = getStorageKey(problemSlug);
    const serialized = JSON.stringify(sessionState);
    
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save session state:', error);
    
    // Handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded - clearing old sessions');
      clearOldSessions(problemSlug);
      
      // Try again after clearing
      try {
        const sessionState: SessionState = {
          currentPhase: state.currentPhase,
          currentStepIndex: state.currentStepIndex,
          savedStepData: Object.fromEntries(state.savedStepData),
          completedSteps: Array.from(state.completedSteps),
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(getStorageKey(problemSlug), JSON.stringify(sessionState));
        return true;
      } catch (retryError) {
        console.error('Failed to save even after clearing:', retryError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Load session state from localStorage
 */
export function loadSessionState(
  problemSlug: string
): {
  currentPhase: string;
  currentStepIndex: number;
  savedStepData: Map<string, SavedStepData>;
  completedSteps: Set<string>;
  lastUpdated: Date | null;
} | null {
  if (!isStorageAvailable()) {
    return null;
  }

  const key = getStorageKey(problemSlug);

  try {
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const parsed: SessionState = JSON.parse(stored);
    
    // Validate the structure
    if (!parsed.currentPhase || typeof parsed.currentStepIndex !== 'number') {
      console.warn('Invalid session state structure - clearing');
      localStorage.removeItem(key);
      return null;
    }

    return {
      currentPhase: parsed.currentPhase,
      currentStepIndex: parsed.currentStepIndex,
      savedStepData: new Map(Object.entries(parsed.savedStepData || {})),
      completedSteps: new Set(parsed.completedSteps || []),
      lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null,
    };
  } catch (error) {
    // SQUASH: Root Cause: Failing to parse invalid JSON didn't actually remove it, leading to unrecoverable UI crashes on next load.
    // SQUASH: Fix: Explicitly remove the corrupted key from localStorage when JSON.parse throws.
    console.error('Failed to load session state:', error);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Clear session state for a specific problem
 */
export function clearSessionState(problemSlug: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const key = getStorageKey(problemSlug);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear session state:', error);
  }
}

/**
 * Clear all old sessions except the current one
 */
function clearOldSessions(currentProblemSlug: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const currentKey = getStorageKey(currentProblemSlug);
    const keysToRemove: string[] = [];

    // Find all session keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && key !== currentKey) {
        keysToRemove.push(key);
      }
    }

    // Remove old sessions
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`Cleared ${keysToRemove.length} old session(s)`);
  } catch (error) {
    console.error('Failed to clear old sessions:', error);
  }
}

/**
 * Get list of all saved sessions
 */
export function getAllSessions(): Array<{
  problemSlug: string;
  lastUpdated: Date;
  stepCount: number;
}> {
  if (!isStorageAvailable()) {
    return [];
  }

  const sessions: Array<{
    problemSlug: string;
    lastUpdated: Date;
    stepCount: number;
  }> = [];

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed: SessionState = JSON.parse(stored);
            const problemSlug = key.replace(`${STORAGE_PREFIX}${STORAGE_VERSION}-`, '');

            // Legacy/partial records may lack lastUpdated; an Invalid Date here
            // would blow up date-fns formatting downstream.
            const lastUpdated = new Date(parsed.lastUpdated);
            sessions.push({
              problemSlug,
              lastUpdated: isNaN(lastUpdated.getTime()) ? new Date(0) : lastUpdated,
              stepCount: Object.keys(parsed.savedStepData ?? {}).length,
            });
          } catch (parseError) {
            // SQUASH: Root Cause: Wrapping the whole loop in a try/catch meant a single corrupted item (e.g. invalid JSON) caused getAllSessions to fail completely, missing valid items.
            // SQUASH: Fix: Wrap parsing in its own try/catch per item. If one item is corrupted, log, remove it, and continue parsing the rest.
            console.error(`Failed to parse session data for key ${key}. Removing corrupted data.`, parseError);
            localStorage.removeItem(key);
            // Iterator adjustment not needed when iterating backwards
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all sessions:', error);
  }

  return sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): {
  used: number;
  available: boolean;
  sessionCount: number;
} {
  if (!isStorageAvailable()) {
    return { used: 0, available: false, sessionCount: 0 };
  }

  let totalSize = 0;
  let sessionCount = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          sessionCount++;
        }
      }
    }

    return {
      used: totalSize,
      available: true,
      sessionCount,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { used: 0, available: true, sessionCount: 0 };
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
}
