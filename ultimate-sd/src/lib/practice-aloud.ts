export const PRACTICE_ALOUD_SEEN_KEY = 'practice-aloud:seen';

export function shouldShowPracticeAloudExplainer(): boolean {
  try {
    return localStorage.getItem(PRACTICE_ALOUD_SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}

export function markPracticeAloudSeen(): void {
  try {
    localStorage.setItem(PRACTICE_ALOUD_SEEN_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}
