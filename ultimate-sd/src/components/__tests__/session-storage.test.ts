import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllSessions } from '../../lib/session-storage';

describe('session-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getAllSessions skips corrupted sessions without failing completely', () => {
    localStorage.setItem('sd-practice-v1-test1', '{"lastUpdated":"2023-01-01T00:00:00Z", "savedStepData": {}}');
    localStorage.setItem('sd-practice-v1-test2', 'corrupt json');
    localStorage.setItem('sd-practice-v1-test3', '{"lastUpdated":"2023-01-02T00:00:00Z", "savedStepData": {}}');

    const sessions = getAllSessions();
    expect(sessions.length).toBe(2);
    expect(sessions[0].problemSlug).toBe('test3'); // sorted by lastUpdated desc
    expect(sessions[1].problemSlug).toBe('test1');
  });
});
