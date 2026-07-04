import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PRACTICE_ALOUD_SEEN_KEY,
  markPracticeAloudSeen,
  shouldShowPracticeAloudExplainer,
} from '@/lib/practice-aloud';

describe('practice-aloud localStorage', () => {
  beforeEach(() => localStorage.clear());

  it('shows explainer until marked seen', () => {
    expect(shouldShowPracticeAloudExplainer()).toBe(true);
    markPracticeAloudSeen();
    expect(shouldShowPracticeAloudExplainer()).toBe(false);
  });

  it('returns false when localStorage throws', () => {
    const spy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(shouldShowPracticeAloudExplainer()).toBe(false);
    spy.mockRestore();
  });

  it('uses the expected storage key', () => {
    markPracticeAloudSeen();
    expect(localStorage.getItem(PRACTICE_ALOUD_SEEN_KEY)).toBe('1');
  });
});
