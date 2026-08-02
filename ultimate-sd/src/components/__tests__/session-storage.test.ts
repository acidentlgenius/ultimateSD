import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllSessions, loadSessionState, _resetStorageCacheForTesting } from '../../lib/session-storage';

describe('session-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetStorageCacheForTesting();
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

  it('loadSessionState clears unparseable session data from localStorage', () => {
    localStorage.setItem('sd-practice-v1-corrupt', 'not a json');

    // Attempt to load should fail and clear the item
    const result = loadSessionState('corrupt');

    expect(result).toBeNull();
    // The key should have been removed
    expect(localStorage.getItem('sd-practice-v1-corrupt')).toBeNull();
  });

  it('caches localStorage availability check to prevent excessive StorageEvents', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    getAllSessions();
    getAllSessions();
    getAllSessions();

    const testKeyCalls = setItemSpy.mock.calls.filter(call => call[0] === '__storage_test__').length;

    expect(testKeyCalls).toBe(1);

    setItemSpy.mockRestore();
  });
});