import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, flattenNavLinks, isNavGroup } from '@/lib/navigation';

describe('NAV_ITEMS', () => {
  it('has the approved top-level order: Home, Learn, Practice, Interview, Pricing', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['Home', 'Learn', 'Practice', 'Interview', 'Pricing']);
  });

  it('groups Roadmap + Guides under Learn', () => {
    const learn = NAV_ITEMS.find((i) => i.label === 'Learn');
    expect(learn && isNavGroup(learn) && learn.links.map((l) => l.href)).toEqual(['/roadmap', '/guides']);
  });

  it('groups Problems + Custom Problem + Draw under Practice', () => {
    const practice = NAV_ITEMS.find((i) => i.label === 'Practice');
    expect(practice && isNavGroup(practice) && practice.links.map((l) => l.href)).toEqual(['/problems', '/custom', '/draw']);
  });

  it('flattens to a unique-href list that includes every destination (mobile parity)', () => {
    const hrefs = flattenNavLinks().map((l) => l.href);
    for (const required of ['/', '/roadmap', '/guides', '/problems', '/custom', '/draw', '/interview', '/pricing']) {
      expect(hrefs).toContain(required);
    }
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
