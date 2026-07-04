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
    // Spy on the prototype: jsdom's Storage is a Proxy that turns own-property
    // writes into storage items, and the in-memory test fallback keeps its
    // methods on its own prototype — this works for both.
    const proto = Object.getPrototypeOf(localStorage) as Storage;
    const spy = vi.spyOn(proto, 'getItem').mockImplementation(() => {
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
