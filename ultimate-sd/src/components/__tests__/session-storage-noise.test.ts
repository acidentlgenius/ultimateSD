import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadSessionState } from '../../lib/session-storage';

describe('session-storage noise suppression', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not log errors to console when parsing fails in test environment', () => {
    localStorage.setItem('sd-practice-v1-corrupt', 'not a json');
    loadSessionState('corrupt');
    expect(console.error).not.toHaveBeenCalled();
  });
});
