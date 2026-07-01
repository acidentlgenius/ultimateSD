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
}

import { safeGetJSON, safeSetJSON, isStorageAvailable } from './localStorageUtils';

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

  const sessionState: SessionState = {
    currentPhase: state.currentPhase,
    currentStepIndex: state.currentStepIndex,
    savedStepData: Object.fromEntries(state.savedStepData),
    completedSteps: Array.from(state.completedSteps),
    lastUpdated: new Date().toISOString(),
  };

  const key = getStorageKey(problemSlug);
  const success = safeSetJSON(key, sessionState);

  if (!success) {
    // If it failed, it might be due to quota. Try clearing old sessions and retry.
    console.warn('Attempting to clear old sessions to free up space for saving.');
    clearOldSessions(problemSlug);
    return safeSetJSON(key, sessionState);
  }

  return true;
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
  const parsed = safeGetJSON<SessionState>(key, null, true);

  if (!parsed) {
    return null;
  }

  // Validate the structure
  if (!parsed.currentPhase || typeof parsed.currentStepIndex !== 'number') {
    console.warn('Invalid session state structure - clearing');
    clearSessionState(problemSlug);
    return null;
  }

  return {
    currentPhase: parsed.currentPhase,
    currentStepIndex: parsed.currentStepIndex,
    savedStepData: new Map(Object.entries(parsed.savedStepData || {})),
    completedSteps: new Set(parsed.completedSteps || []),
    lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null,
  };
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
    // Iterate backwards so that removing an item doesn't affect the indices of unprocessed items
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        // safeGetJSON handles JSON.parse and will auto-remove corrupted data.
        const parsed = safeGetJSON<SessionState>(key, null, true);
        if (parsed && typeof parsed === 'object') {
          const problemSlug = key.replace(`${STORAGE_PREFIX}${STORAGE_VERSION}-`, '');

          sessions.push({
            problemSlug,
            lastUpdated: new Date(parsed.lastUpdated),
            stepCount: parsed.savedStepData ? Object.keys(parsed.savedStepData).length : 0,
          });
        } else if (!parsed) {
          // If parsed is falsy but safeGetJSON didn't remove it (e.g. valid JSON string "null" or ""),
          // we should forcefully remove it to prevent issues, since we expect a SessionState object.
          localStorage.removeItem(key);
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
