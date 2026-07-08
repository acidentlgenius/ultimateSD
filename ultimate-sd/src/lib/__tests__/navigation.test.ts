import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, flattenNavLinks, isNavGroup } from '@/lib/navigation';

describe('NAV_ITEMS', () => {
  it('has the approved top-level order: Home, Problems, Learn, Interview, Pricing', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['Home', 'Problems', 'Learn', 'Interview', 'Pricing']);
  });

  it('keeps Problems top-level (core action must never be buried in a dropdown)', () => {
    const problems = NAV_ITEMS.find((i) => i.label === 'Problems');
    expect(problems && !isNavGroup(problems) && problems.href).toBe('/problems');
  });

  it('groups Roadmap + Guides + Custom Problem + Draw under Learn', () => {
    const learn = NAV_ITEMS.find((i) => i.label === 'Learn');
    expect(learn && isNavGroup(learn) && learn.links.map((l) => l.href)).toEqual([
      '/roadmap',
      '/guides',
      '/custom',
      '/draw',
    ]);
  });

  it('flattens to a unique-href list that includes every destination (mobile parity)', () => {
    const hrefs = flattenNavLinks().map((l) => l.href);
    for (const required of ['/', '/roadmap', '/guides', '/problems', '/custom', '/draw', '/interview', '/pricing']) {
      expect(hrefs).toContain(required);
    }
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
