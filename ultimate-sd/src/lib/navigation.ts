import { BookOpen, Home, Layers, Map, Palette, PencilRuler, Sparkles, Timer, type LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  links: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'links' in item;
}

/**
 * Single source of truth for main navigation. Desktop (Header) renders
 * groups as dropdowns; mobile (MobileMenu) renders flattenNavLinks().
 * Keep desktop and mobile in sync by editing ONLY this file.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  // Problems is the core action — keep it top-level, never buried in a dropdown.
  { href: '/problems', label: 'Problems', icon: Layers },
  {
    label: 'Learn',
    icon: BookOpen,
    links: [
      { href: '/roadmap', label: 'Roadmap', icon: Map },
      { href: '/guides', label: 'Guides', icon: BookOpen },
      { href: '/custom', label: 'Custom Problem', icon: PencilRuler },
      { href: '/draw', label: 'Draw', icon: Palette },
    ],
  },
  { href: '/interview', label: 'Interview', icon: Timer },
  { href: '/pricing', label: 'Pricing', icon: Sparkles },
];

/** Flat, de-duplicated (by href) link list for the mobile menu. */
export function flattenNavLinks(): NavLink[] {
  const links: NavLink[] = [];
  const seen = new Set<string>();
  for (const item of NAV_ITEMS) {
    const candidates = isNavGroup(item) ? item.links : [item];
    for (const link of candidates) {
      if (!seen.has(link.href)) {
        seen.add(link.href);
        links.push(link);
      }
    }
  }
  return links;
}
