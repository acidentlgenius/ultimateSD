import { describe, expect, it } from 'vitest';
import { WHATS_NEW_ENTRIES, getLatestEntry } from '@/lib/whats-new';

describe('WHATS_NEW_ENTRIES', () => {
  it('is non-empty and sorted newest-first by date', () => {
    expect(WHATS_NEW_ENTRIES.length).toBeGreaterThan(0);
    const dates = WHATS_NEW_ENTRIES.map((e) => e.date);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it('has unique ids and ISO yyyy-mm-dd dates', () => {
    const ids = WHATS_NEW_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of WHATS_NEW_ENTRIES) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('getLatestEntry returns the first entry', () => {
    expect(getLatestEntry()?.id).toBe(WHATS_NEW_ENTRIES[0].id);
  });
});
