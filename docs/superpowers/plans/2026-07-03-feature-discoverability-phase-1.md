# Feature Discoverability — Phase 1 (Pre-Flag-Flip Quick Wins) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the seven pre-flag-flip quick wins from the approved spec (`docs/superpowers/specs/2026-07-03-feature-discoverability-improvement-plan.md`): unified navigation, a What's New page + header notifier, a `FeatureUpsell` interstitial replacing silent flag-stripping, pricing feature badges + `?feature=` highlighting, an AI Interviewer waitlist section on the landing page, an onboarding intent question, and removal of the vestigial `/home` route.

**Architecture:** All work is inside the Next.js app at `ultimate-sd/` (App Router, server components by default). Shared data lives in small `src/lib/*.ts` modules with vitest unit tests; UI consumes those modules so desktop/mobile/pricing can never drift apart again. Two small Prisma schema additions (waitlist table, `practiceIntent` column).

**Tech Stack:** Next.js 16 (App Router), React server components + `'use client'` islands, Prisma 7 + Postgres, Radix UI primitives (`src/components/ui/`), Tailwind, framer-motion, lucide-react icons, sonner toasts, vitest (jsdom, globals) for unit tests.

## Global Constraints

- Working directory for ALL commands: `ultimate-sd/` (the repo root is one level up).
- Package manager: `pnpm` (node ≥ 22.13, pnpm ≥ 11.9). Tests: `pnpm vitest run <path>`.
- Path alias `@/` → `ultimate-sd/src/`.
- Do NOT change any `FEATURE_SEED_DEFAULTS` / flag values — this phase ships while all flags stay dark.
- Feature keys are exactly the existing `FeatureKey` union from `@/lib/plans`: `fresherTrack | interviewMode | aiProbe | lifetimePlan | voiceInterview`.
- Desktop nav labels, verbatim: `Home`, `Learn` (dropdown: `Roadmap`, `Blog`), `Practice` (dropdown: `Problems`, `Custom Problem`, `Draw`), `Pricing`. Mobile shows the flattened set of the same links.
- User-facing feature names in copy: “AI Interviewer” (umbrella for interview mode + voice), “Interview Mode”, “Voice Interview”. Do NOT introduce “Defend your design” yet — the Probe rename is Phase 2.
- No client-side analytics work in this phase (server-side PostHog exists; wiring client events is out of scope).
- Match existing code style: single quotes in `src/lib`, existing Tailwind idioms, `cn()` from `@/lib/utils`.
- Commit after every task (steps include the commands). Do not push.

---

### Task 1: Shared navigation source of truth + unified desktop/mobile nav

Fixes spec findings F3 (blog orphaned), F4 (draw unreachable on desktop), F5 (desktop/mobile mismatch, pricing missing on mobile).

**Files:**
- Create: `src/lib/navigation.ts`
- Create: `src/lib/__tests__/navigation.test.ts`
- Create: `src/components/NavDropdown.tsx`
- Modify: `src/components/Header.tsx:40-75` (replace the desktop `<nav>` block)
- Modify: `src/components/MobileMenu.tsx:5,39-43` (icon imports + `menuItems`)

**Interfaces:**
- Produces: `NavLink { href: string; label: string; icon: LucideIcon }`, `NavGroup { label: string; icon: LucideIcon; links: NavLink[] }`, `NavItem = NavLink | NavGroup`, `NAV_ITEMS: NavItem[]`, `isNavGroup(item: NavItem): item is NavGroup`, `flattenNavLinks(): NavLink[]`. Tasks 2+ don’t depend on this, but Header edits in Task 2 assume this task’s Header layout is in place.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/navigation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, flattenNavLinks, isNavGroup } from '@/lib/navigation';

describe('NAV_ITEMS', () => {
  it('has the approved top-level order: Home, Learn, Practice, Pricing', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['Home', 'Learn', 'Practice', 'Pricing']);
  });

  it('groups Roadmap + Blog under Learn', () => {
    const learn = NAV_ITEMS.find((i) => i.label === 'Learn');
    expect(learn && isNavGroup(learn) && learn.links.map((l) => l.href)).toEqual(['/roadmap', '/blog']);
  });

  it('groups Problems + Custom Problem + Draw under Practice', () => {
    const practice = NAV_ITEMS.find((i) => i.label === 'Practice');
    expect(practice && isNavGroup(practice) && practice.links.map((l) => l.href)).toEqual(['/', '/custom', '/draw']);
  });

  it('flattens to a unique-href list that includes every destination (mobile parity)', () => {
    const hrefs = flattenNavLinks().map((l) => l.href);
    for (const required of ['/', '/roadmap', '/blog', '/custom', '/draw', '/pricing']) {
      expect(hrefs).toContain(required);
    }
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/navigation.test.ts`
Expected: FAIL — `Cannot find module '@/lib/navigation'` (or equivalent resolve error).

- [ ] **Step 3: Write the implementation**

Create `src/lib/navigation.ts`:

```ts
import { BookOpen, GraduationCap, Home, Layers, Map, Palette, PencilRuler, Sparkles, type LucideIcon } from 'lucide-react';

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
  {
    label: 'Learn',
    icon: GraduationCap,
    links: [
      { href: '/roadmap', label: 'Roadmap', icon: Map },
      { href: '/blog', label: 'Blog', icon: BookOpen },
    ],
  },
  {
    label: 'Practice',
    icon: Layers,
    links: [
      { href: '/', label: 'Problems', icon: Layers },
      { href: '/custom', label: 'Custom Problem', icon: PencilRuler },
      { href: '/draw', label: 'Draw', icon: Palette },
    ],
  },
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
```

Note: `Home` appears both top-level and as `Problems` (`/`) inside Practice — `flattenNavLinks()` de-dupes by href, so mobile shows `/` once (labeled `Home`, the first occurrence).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/navigation.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Create the desktop dropdown component**

Create `src/components/NavDropdown.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { NavGroup } from '@/lib/navigation';

export function NavDropdown({ group }: { group: NavGroup }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 outline-none',
          'hover:bg-background/80 hover:text-primary hover:shadow-sm',
          'text-muted-foreground data-[state=open]:bg-background/80 data-[state=open]:text-primary'
        )}
      >
        <group.icon className="h-4 w-4" />
        <span>{group.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" sideOffset={8}>
        {group.links.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href} className="flex items-center gap-2 cursor-pointer">
              <link.icon className="h-4 w-4 text-muted-foreground" />
              <span>{link.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 6: Rewire Header desktop nav**

In `src/components/Header.tsx`, replace the entire desktop `<nav>…</nav>` block (currently lines 40–75, the three hardcoded `<Link>`s for Home/Roadmap/Pricing) with:

```tsx
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 justify-self-center bg-secondary/30 p-1 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md shadow-sm shrink-0">
          {NAV_ITEMS.map((item) =>
            isNavGroup(item) ? (
              <NavDropdown key={item.label} group={item} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                  "hover:bg-background/80 hover:text-primary hover:shadow-sm",
                  "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", item.label === 'Pricing' && "h-3.5 w-3.5 text-amber-500")} />
                <span>{item.label}</span>
              </Link>
            )
          )}
        </nav>
```

Update Header imports: remove `Home, Map` from the lucide import (keep `Sparkles` — still used by the “AI Powered Practice” chip), and add:

```tsx
import { NAV_ITEMS, isNavGroup } from '@/lib/navigation';
import { NavDropdown } from '@/components/NavDropdown';
```

- [ ] **Step 7: Rewire MobileMenu from the shared source**

In `src/components/MobileMenu.tsx`:
- Replace the hardcoded `menuItems` array (lines 39–43) with:

```tsx
  const menuItems = flattenNavLinks();
```

- Update imports: remove `Home, Palette, Map` from the lucide import (keep `Menu, X, BookOpen, LogIn, Sparkles`), and add:

```tsx
import { flattenNavLinks } from '@/lib/navigation';
```

The render loop already uses `item.href / item.label / item.icon`, so no other changes needed.

- [ ] **Step 8: Verify build + lint**

Run: `pnpm lint && pnpm vitest run src/lib/__tests__/navigation.test.ts`
Expected: lint clean (no unused-import errors), tests PASS.

Then run: `pnpm dev` briefly (or `pnpm build` if no dev server available) and confirm no compile errors on `/`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/navigation.ts src/lib/__tests__/navigation.test.ts src/components/NavDropdown.tsx src/components/Header.tsx src/components/MobileMenu.tsx
git commit -m "feat(nav): unified desktop/mobile navigation with Learn+Practice groups (Blog, Draw, Custom now discoverable)"
```

---

### Task 2: What's New — data module, `/whats-new` page, header notifier

Implements spec §2.7 (finding F6): the dedicated changelog page + header bell with unread dot. This becomes the launch channel for every future flag flip.

**Files:**
- Create: `src/lib/whats-new.ts`
- Create: `src/lib/__tests__/whats-new.test.ts`
- Create: `src/app/whats-new/page.tsx`
- Create: `src/components/WhatsNewNotifier.tsx`
- Modify: `src/components/Header.tsx` (mount notifier next to `ThemeToggle`)
- Modify: `src/components/UserMenu.tsx:54-65` (add “What's New” menu item)

**Interfaces:**
- Consumes: Header layout from Task 1.
- Produces: `WhatsNewEntry { id: string; date: string; title: string; description: string; href?: string; plans?: PlanType[]; status: 'live' | 'coming-soon' }`, `WHATS_NEW_ENTRIES: WhatsNewEntry[]` (newest first), `getLatestEntry(): WhatsNewEntry | null`, localStorage key literal `'whats-new:last-seen'`. Future flag flips add one entry to `WHATS_NEW_ENTRIES` — that is the whole release process.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/whats-new.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/whats-new.test.ts`
Expected: FAIL — cannot resolve `@/lib/whats-new`.

- [ ] **Step 3: Write the data module with seed entries**

Create `src/lib/whats-new.ts`:

```ts
import type { PlanType } from '@/lib/plans';

export interface WhatsNewEntry {
  /** Stable slug; never reuse. Convention: yyyy-mm-short-name */
  id: string;
  /** ISO date yyyy-mm-dd. Entries MUST stay sorted newest-first. */
  date: string;
  title: string;
  description: string;
  /** Optional "Try it" deep link. */
  href?: string;
  /** Plans the feature is (or will be) available on. Omit = everyone. */
  plans?: PlanType[];
  status: 'live' | 'coming-soon';
}

/**
 * The product changelog. RELEASE PROCESS for feature-flag flips:
 * flip the flag → prepend an entry here (status 'live') → deploy.
 * The header notifier announces it to every active user automatically.
 */
export const WHATS_NEW_ENTRIES: WhatsNewEntry[] = [
  {
    id: '2026-07-ai-interviewer-preview',
    date: '2026-07-03',
    title: 'AI Interviewer is coming',
    description:
      'Timed mock interviews with a strict countdown, a voice interview you answer out loud, and an AI hiring-committee debrief at the end. Rolling out soon — join the waitlist from the home page.',
    href: '/#ai-interviewer',
    plans: ['platform', 'lifetime', 'ai'],
    status: 'coming-soon',
  },
  {
    id: '2026-07-unified-navigation',
    date: '2026-07-03',
    title: 'Blog, Draw and Custom Problems in the navigation',
    description:
      'The free diagram canvas, interactive articles, and custom problem builder now live under Learn and Practice in the main menu — on desktop and mobile.',
    href: '/draw',
    status: 'live',
  },
];

export const WHATS_NEW_LAST_SEEN_KEY = 'whats-new:last-seen';

export function getLatestEntry(): WhatsNewEntry | null {
  return WHATS_NEW_ENTRIES[0] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/whats-new.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Create the `/whats-new` page**

Create `src/app/whats-new/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WHATS_NEW_ENTRIES } from '@/lib/whats-new';
import { PLAN_LABELS } from '@/lib/plans';

export const metadata: Metadata = {
  title: "What's New - Ultimate SD",
  description: 'Latest features and improvements on Ultimate SD.',
};

export default function WhatsNewPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          What&apos;s New
        </h1>
        <p className="text-lg text-muted-foreground">
          Every feature and improvement we ship, in one place.
        </p>
      </div>

      <div className="space-y-10">
        {WHATS_NEW_ENTRIES.map((entry) => (
          <article key={entry.id} className="relative pl-6 border-l-2 border-border">
            <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary" />
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <time dateTime={entry.date} className="text-sm text-muted-foreground font-medium">
                {entry.date}
              </time>
              {entry.status === 'coming-soon' && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                  Coming soon
                </Badge>
              )}
              {entry.plans?.map((plan) => (
                <Badge key={plan} variant="secondary">{PLAN_LABELS[plan]} plan</Badge>
              ))}
            </div>
            <h2 className="text-xl font-semibold mb-2">{entry.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{entry.description}</p>
            {entry.href && entry.status === 'live' && (
              <Link href={entry.href} className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-primary hover:underline">
                Try it <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create the header notifier**

Create `src/components/WhatsNewNotifier.tsx`. Unread state is localStorage-only; reads are wrapped in try/catch per the corrupt-localStorage lesson (PR #136):

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { WHATS_NEW_ENTRIES, WHATS_NEW_LAST_SEEN_KEY, getLatestEntry } from '@/lib/whats-new';

function readLastSeen(): string | null {
  try {
    return window.localStorage.getItem(WHATS_NEW_LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function WhatsNewNotifier() {
  const [hasUnread, setHasUnread] = useState(false);
  const latest = getLatestEntry();

  useEffect(() => {
    if (latest && readLastSeen() !== latest.id) {
      setHasUnread(true);
    }
  }, [latest]);

  const markSeen = () => {
    if (!latest) return;
    try {
      window.localStorage.setItem(WHATS_NEW_LAST_SEEN_KEY, latest.id);
    } catch {
      // localStorage unavailable — dot just reappears next visit
    }
    setHasUnread(false);
  };

  if (!latest) return null;

  return (
    <DropdownMenu onOpenChange={(open) => open && markSeen()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="What's new" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuLabel>What&apos;s New</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WHATS_NEW_ENTRIES.slice(0, 3).map((entry) => (
          <DropdownMenuItem key={entry.id} asChild>
            <Link href="/whats-new" className="flex flex-col items-start gap-0.5 cursor-pointer py-2">
              <span className="text-sm font-medium">{entry.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{entry.description}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/whats-new" className="flex items-center gap-1 cursor-pointer text-sm font-semibold text-primary">
            See all updates <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 7: Mount in Header and UserMenu**

In `src/components/Header.tsx`, import and render the notifier between the divider and `ThemeToggle` (inside the right-hand `div`, currently around line 83):

```tsx
import { WhatsNewNotifier } from '@/components/WhatsNewNotifier';
```

```tsx
          <div className="h-6 w-px bg-border/40 mx-1" />
          <WhatsNewNotifier />
          <ThemeToggle />
```

In `src/components/UserMenu.tsx`, add a menu item after the Settings item (after line 65), matching the existing pattern:

```tsx
                    <DropdownMenuItem asChild>
                        <Link href="/whats-new" className="cursor-pointer">
                            <Sparkles className="mr-2 h-4 w-4" />
                            <span>What&apos;s New</span>
                        </Link>
                    </DropdownMenuItem>
```

Add `Sparkles` to the lucide import at `UserMenu.tsx:7`.

- [ ] **Step 8: Verify**

Run: `pnpm lint && pnpm vitest run src/lib/__tests__/whats-new.test.ts`
Expected: clean lint, tests PASS. Load `/whats-new` in dev — entries render, bell shows dot, opening the bell clears the dot, reload keeps it cleared.

- [ ] **Step 9: Commit**

```bash
git add src/lib/whats-new.ts src/lib/__tests__/whats-new.test.ts src/app/whats-new src/components/WhatsNewNotifier.tsx src/components/Header.tsx src/components/UserMenu.tsx
git commit -m "feat: What's New changelog page and header notifier with unread dot"
```

---

### Task 3: FeatureUpsell interstitial — replace silent flag-stripping

Implements spec §3.3 (finding F2). A non-entitled user requesting `?interview=` sees a pitch + pricing CTA instead of a silent redirect.

**Files:**
- Create: `src/lib/feature-upsell.ts`
- Create: `src/lib/__tests__/feature-upsell.test.ts`
- Create: `src/components/FeatureUpsell.tsx`
- Modify: `src/app/practice/[slug]/page.tsx:66-68` (the “dark flag” redirect)

**Interfaces:**
- Consumes: `FeatureKey`, `FEATURE_INTENDED_PLANS`, `PLAN_LABELS` from `@/lib/plans`.
- Produces: `FEATURE_UPSELL_COPY: Record<FeatureKey, { title: string; pitch: string }>`, `getFeatureHighlightPlan(feature: FeatureKey): PlanType | null`, `<FeatureUpsell feature={FeatureKey} continueHref={string} continueLabel={string} />`. Task 4 reuses `getFeatureHighlightPlan` for `?feature=` highlighting — signature must match exactly.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/feature-upsell.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FEATURE_KEYS } from '@/lib/plans';
import { FEATURE_UPSELL_COPY, getFeatureHighlightPlan } from '@/lib/feature-upsell';

describe('FEATURE_UPSELL_COPY', () => {
  it('has title and pitch for every feature key', () => {
    for (const key of FEATURE_KEYS) {
      expect(FEATURE_UPSELL_COPY[key].title.length).toBeGreaterThan(0);
      expect(FEATURE_UPSELL_COPY[key].pitch.length).toBeGreaterThan(0);
    }
  });
});

describe('getFeatureHighlightPlan', () => {
  it('routes AI-plan features to the ai card', () => {
    expect(getFeatureHighlightPlan('aiProbe')).toBe('ai');
    expect(getFeatureHighlightPlan('voiceInterview')).toBe('ai');
    expect(getFeatureHighlightPlan('interviewMode')).toBe('ai');
  });

  it('returns null for features intended to include the free plan (nothing to upsell)', () => {
    expect(getFeatureHighlightPlan('fresherTrack')).toBeNull();
    expect(getFeatureHighlightPlan('lifetimePlan')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/feature-upsell.test.ts`
Expected: FAIL — cannot resolve `@/lib/feature-upsell`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/feature-upsell.ts`:

```ts
import { FEATURE_INTENDED_PLANS, type FeatureKey, type PlanType } from '@/lib/plans';

export const FEATURE_UPSELL_COPY: Record<FeatureKey, { title: string; pitch: string }> = {
  interviewMode: {
    title: 'Interview Mode',
    pitch:
      'A timed mock interview with a strict countdown and no hints — then an AI hiring-committee debrief that scores your performance phase by phase, exportable as a PDF.',
  },
  voiceInterview: {
    title: 'Voice Interview',
    pitch:
      'Answer out loud, exactly like the real thing. Push-to-talk voice practice with an AI interviewer that listens, follows up, and keeps you talking through your design.',
  },
  aiProbe: {
    title: 'AI Probe',
    pitch:
      'After you pass a step, an AI skeptic challenges your design with the follow-up questions a real interviewer would ask — defend your choices under pressure.',
  },
  fresherTrack: {
    title: 'Fresher Track',
    pitch: 'A guided learning path built for engineers starting system design from scratch.',
  },
  lifetimePlan: {
    title: 'Lifetime Access',
    pitch: 'Pay once, own the full problem library, expert solutions, and interview mode forever.',
  },
};

/** Which pricing card to highlight when upselling this feature. */
const PLAN_HIGHLIGHT_PRIORITY: PlanType[] = ['ai', 'platform', 'lifetime'];

export function getFeatureHighlightPlan(feature: FeatureKey): PlanType | null {
  const intended = FEATURE_INTENDED_PLANS[feature];
  if (intended.includes('free')) return null;
  return PLAN_HIGHLIGHT_PRIORITY.find((plan) => intended.includes(plan)) ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/feature-upsell.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Create the interstitial component**

Create `src/components/FeatureUpsell.tsx` (server component — no interactivity needed):

```tsx
import Link from 'next/link';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLAN_LABELS, type FeatureKey } from '@/lib/plans';
import { FEATURE_UPSELL_COPY, getFeatureHighlightPlan } from '@/lib/feature-upsell';

interface FeatureUpsellProps {
  feature: FeatureKey;
  /** Where "Continue without" goes (e.g. the plain practice page). */
  continueHref: string;
  continueLabel: string;
}

export function FeatureUpsell({ feature, continueHref, continueLabel }: FeatureUpsellProps) {
  const copy = FEATURE_UPSELL_COPY[feature];
  const highlightPlan = getFeatureHighlightPlan(feature);

  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <div className="flex items-center justify-center gap-2 mb-3">
        <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
        {highlightPlan && <Badge variant="secondary">{PLAN_LABELS[highlightPlan]} plan</Badge>}
      </div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-10">{copy.pitch}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" className="h-12 px-8 rounded-full" asChild>
          <Link href={`/pricing?feature=${feature}`}>
            <Sparkles className="mr-2 h-4 w-4" />
            See plans
          </Link>
        </Button>
        <Button size="lg" variant="ghost" className="h-12 px-6 rounded-full text-muted-foreground" asChild>
          <Link href={continueHref}>
            {continueLabel} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Replace the silent redirect in the practice page**

In `src/app/practice/[slug]/page.tsx`, add the import:

```tsx
import { FeatureUpsell } from '@/components/FeatureUpsell';
```

Replace lines 66–68:

```tsx
  if (requestedVariant && !interviewAllowed) {
    redirect(`/practice/${slug}`); // dark flag: strip the interview param entirely
  }
```

with:

```tsx
  if (requestedVariant && !interviewAllowed) {
    // Feature not launched for this user: pitch it instead of silently stripping the param.
    return (
      <FeatureUpsell
        feature="interviewMode"
        continueHref={`/practice/${slug}`}
        continueLabel="Practice without interview mode"
      />
    );
  }
```

- [ ] **Step 7: Verify**

Run: `pnpm lint && pnpm vitest run src/lib/__tests__/feature-upsell.test.ts`
Expected: clean, PASS.

Manual check in dev: as a user without the `interviewMode` flag, open `/practice/design-tinyurl?interview=lite` → interstitial renders with “See plans” → `/pricing?feature=interviewMode`, and “Practice without interview mode” → normal practice. (All flags seed dark, so any non-overridden user works for this check.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/feature-upsell.ts src/lib/__tests__/feature-upsell.test.ts src/components/FeatureUpsell.tsx "src/app/practice/[slug]/page.tsx"
git commit -m "feat: FeatureUpsell interstitial replaces silent interview-mode flag stripping"
```

---

### Task 4: Pricing — flagship feature rows with availability badges + `?feature=` highlight

Implements spec §3.2 (finding F7 on the pricing side): sell the roadmap while flags are dark; land locked-touchpoint traffic on the right card.

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/pricing/PricingClient.tsx`

**Interfaces:**
- Consumes: `getFeatureHighlightPlan` from Task 3; `getFeatureFlagState(feature): Promise<PlanType[]>` from `@/lib/feature-flags-server` (existing); `FEATURE_KEYS`, `FeatureKey`, `PlanType` from `@/lib/plans`.
- Produces: `PricingClient` gains props `highlightPlan?: PlanType | null` and `flagshipAvailability: Record<'interviewMode' | 'voiceInterview' | 'aiProbe', PlanType[]>` (live enabled-plans per feature, from the DB flags). URL contract: `/pricing?feature=<FeatureKey>` — unknown keys fall back to the plain page.

- [ ] **Step 1: Wire the server page**

In `src/app/pricing/page.tsx`, extend the page to read `searchParams` and fetch flag states. The current page fetches `showLifetime` via `canAccessFeature`; add alongside (adapt to the file's existing structure — it already imports `canAccessFeature` from `@/lib/feature-flags-server` and renders `<PricingClient …/>`):

```tsx
import { getFeatureFlagState } from '@/lib/feature-flags-server';
import { FEATURE_KEYS, type FeatureKey } from '@/lib/plans';
import { getFeatureHighlightPlan } from '@/lib/feature-upsell';
```

Inside the page component (it must accept `searchParams: Promise<{ feature?: string; locked?: string }>` — keep any existing `locked` handling untouched):

```tsx
  const { feature } = await searchParams;
  const featureKey = FEATURE_KEYS.includes(feature as FeatureKey) ? (feature as FeatureKey) : null;
  const highlightPlan = featureKey ? getFeatureHighlightPlan(featureKey) : null;

  const [interviewModePlans, voiceInterviewPlans, aiProbePlans] = await Promise.all([
    getFeatureFlagState('interviewMode'),
    getFeatureFlagState('voiceInterview'),
    getFeatureFlagState('aiProbe'),
  ]);
```

Pass to the client component:

```tsx
      <PricingClient
        /* …existing props… */
        highlightPlan={highlightPlan}
        flagshipAvailability={{
          interviewMode: interviewModePlans,
          voiceInterview: voiceInterviewPlans,
          aiProbe: aiProbePlans,
        }}
      />
```

- [ ] **Step 2: Add flagship rows + badges to PricingClient**

In `src/app/pricing/PricingClient.tsx`:

2a. Extend the props interface:

```tsx
import type { FeatureKey } from '@/lib/plans';

interface PricingClientProps {
  isLoggedIn: boolean;
  currentPlan: PlanType;
  razorpayKeyId?: string;
  showLifetime?: boolean;
  highlightPlan?: PlanType | null;
  flagshipAvailability: Partial<Record<FeatureKey, PlanType[]>>;
}
```

2b. Define flagship rows (below the existing `FREE_FEATURES` const). Each row names the plans it belongs to, per `FEATURE_INTENDED_PLANS`:

```tsx
const FLAGSHIP_ROWS: { feature: FeatureKey; label: string; plans: PlanType[] }[] = [
  { feature: 'interviewMode', label: 'Interview Mode — timed mock + AI debrief', plans: ['platform', 'lifetime', 'ai'] },
  { feature: 'voiceInterview', label: 'Voice Interview — practice out loud', plans: ['ai'] },
  { feature: 'aiProbe', label: 'AI Probe — defend your design under follow-ups', plans: ['ai'] },
];
```

2c. Inside the component, add a helper and per-plan row renderer (uses the existing `Badge` — add `import { Badge } from '@/components/ui/badge';`):

```tsx
  const flagshipRowsFor = (plan: Exclude<PlanType, 'free'>) =>
    FLAGSHIP_ROWS.filter((row) => row.plans.includes(plan)).map((row) => {
      const live = (flagshipAvailability[row.feature] ?? []).includes(plan);
      return (
        <li key={row.feature} className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
          <span>{row.label}</span>
          {!live && (
            <Badge variant="outline" className="ml-1 shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-400 text-[10px]">
              Coming soon
            </Badge>
          )}
        </li>
      );
    });
```

Append `{flagshipRowsFor('platform')}`, `{flagshipRowsFor('ai')}`, `{flagshipRowsFor('lifetime')}` at the end of the respective `<ul>` in each plan card (after the existing `.map()` over `PLATFORM_FEATURES` / `AI_FEATURES` / `LIFETIME_FEATURES`). In the Lifetime card, also delete the now-duplicated `'Interview mode'` string from `LIFETIME_FEATURES`.

2d. Highlight + scroll. Add refs and an effect at the top of the component:

```tsx
import { useEffect, useRef } from 'react';
```

```tsx
  const cardRefs = useRef<Partial<Record<PlanType, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (highlightPlan) {
      cardRefs.current[highlightPlan]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightPlan]);

  const highlightClass = (plan: PlanType) =>
    highlightPlan === plan ? 'ring-2 ring-primary shadow-2xl shadow-primary/20 scale-[1.02]' : '';
```

On each of the four `<Card>` elements add a ref and the class, e.g. for the AI card:

```tsx
      <Card
        ref={(el) => { cardRefs.current.ai = el; }}
        className={`relative overflow-hidden border-indigo-500/50 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 ring-1 ring-indigo-500/20 ${highlightClass('ai')}`}
      >
```

(same pattern with keys `free`, `platform`, `lifetime` on the other cards — if `Card` doesn't forward refs, wrap each card in a plain `<div ref={…}>` instead; check `src/components/ui/card.tsx` first).

- [ ] **Step 3: Verify**

Run: `pnpm lint`
Expected: clean.

Manual check in dev:
- `/pricing` → each paid card shows its flagship rows with “Coming soon” badges (flags are dark).
- `/pricing?feature=interviewMode` → page scrolls to and rings the AI card.
- `/pricing?feature=garbage` → plain page, no crash.

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/page.tsx src/app/pricing/PricingClient.tsx
git commit -m "feat(pricing): flagship feature rows with coming-soon badges and ?feature= card highlighting"
```

---

### Task 5: AI Interviewer landing section + waitlist

Implements spec §3.1 (finding F7): market the differentiator before it launches; capture demand.

**Files:**
- Modify: `prisma/schema.prisma` (add `WaitlistSignup` model)
- Create: `src/lib/waitlist.ts`
- Create: `src/lib/__tests__/waitlist.test.ts`
- Create: `src/app/actions/waitlist.ts`
- Create: `src/components/landing/AiInterviewerSection.tsx`
- Modify: `src/components/landing/DashboardClient.tsx:251` (mount for logged-out users)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `isValidEmail(email: string): boolean` and `normalizeEmail(email: string): string` in `@/lib/waitlist`; server action `joinWaitlist(email: string): Promise<{ success: boolean; error?: string }>` (idempotent per email); Prisma model `WaitlistSignup { id, email @unique, feature, createdAt }`.

- [ ] **Step 1: Write the failing validation test**

Create `src/lib/__tests__/waitlist.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('dev@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.domain.co.in')).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@example.com')).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Dev@Example.COM ')).toBe('dev@example.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/waitlist.test.ts`
Expected: FAIL — cannot resolve `@/lib/waitlist`.

- [ ] **Step 3: Write the validation module**

Create `src/lib/waitlist.ts`:

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/waitlist.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the Prisma model and migrate**

In `prisma/schema.prisma`, add after the existing models:

```prisma
model WaitlistSignup {
  id        String   @id @default(cuid())
  email     String   @unique
  feature   String   @default("aiInterviewer")
  createdAt DateTime @default(now())
}
```

Run: `pnpm prisma migrate dev --name add_waitlist_signup`
Expected: migration created and applied; `prisma generate` runs. (If no local DB is reachable, run `pnpm prisma migrate diff` alternatives are NOT acceptable — stop and ask the user for DB access rather than faking the migration.)

- [ ] **Step 6: Create the server action**

Create `src/app/actions/waitlist.ts` (mirrors error-shape of `src/app/actions/progress/preferences.ts`):

```ts
'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    // Upsert = idempotent: signing up twice is a no-op, not an error.
    await prisma.waitlistSignup.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized, feature: 'aiInterviewer' },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to join waitlist:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
```

- [ ] **Step 7: Create the landing section**

Create `src/components/landing/AiInterviewerSection.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Timer, MessageSquareWarning, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { joinWaitlist } from '@/app/actions/waitlist';

const PILLARS = [
  {
    icon: Timer,
    title: 'Timed Mock Interview',
    description: 'A strict countdown, no hints — then an AI hiring-committee debrief scores every phase.',
  },
  {
    icon: Mic,
    title: 'Voice Interview',
    description: 'Answer out loud. The AI interviewer listens, follows up, and keeps you talking.',
  },
  {
    icon: MessageSquareWarning,
    title: 'AI Probe',
    description: 'Passed a step? An AI skeptic challenges your design with real follow-up questions.',
  },
];

export function AiInterviewerSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    const result = await joinWaitlist(email);
    if (result.success) {
      setStatus('done');
      toast.success("You're on the list!", { description: "We'll email you the moment the AI Interviewer goes live." });
    } else {
      setStatus('idle');
      toast.error(result.error ?? 'Something went wrong.');
    }
  };

  return (
    <section id="ai-interviewer" className="container mx-auto px-4 py-24">
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary mb-6 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium">Coming soon</span>
        </motion.div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Meet your{' '}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Interviewer
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The pressure of a real system design round — without the real stakes.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-14">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
            <pillar.icon className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">{pillar.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto text-center">
        {status === 'done' ? (
          <p className="text-lg font-medium text-primary">You&apos;re on the waitlist 🎉</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-full px-5"
            />
            <Button type="submit" size="lg" disabled={status === 'saving'} className="h-12 px-6 rounded-full shrink-0">
              {status === 'saving' ? 'Joining…' : 'Join waitlist'}
            </Button>
          </form>
        )}
        <p className="text-xs text-muted-foreground mt-3">Be first in line when it launches. No spam.</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Mount on the landing page**

In `src/components/landing/DashboardClient.tsx`, add the import and render it for logged-out users directly after the `FeatureShowcase` line (currently line 251: `{!user && <FeatureShowcase />}`):

```tsx
import { AiInterviewerSection } from '@/components/landing/AiInterviewerSection';
```

```tsx
            {!user && <FeatureShowcase />}
            {!user && <AiInterviewerSection />}
```

- [ ] **Step 9: Verify**

Run: `pnpm lint && pnpm vitest run src/lib/__tests__/waitlist.test.ts`
Expected: clean, PASS.

Manual check in dev (logged out): section renders after the showcase; submitting a valid email shows the success toast and swaps to the “on the waitlist” state; submitting the same email again (fresh page) still succeeds (idempotent); `not-an-email` shows the validation error toast.

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/waitlist.ts src/lib/__tests__/waitlist.test.ts src/app/actions/waitlist.ts src/components/landing/AiInterviewerSection.tsx src/components/landing/DashboardClient.tsx
git commit -m "feat(landing): AI Interviewer coming-soon section with idempotent waitlist capture"
```

---

### Task 6: Onboarding intent question

Implements spec finding F8: capture *why* the user is here (interview soon / upskilling / learning from scratch) as the personalization signal Phase 3 will consume.

**Files:**
- Modify: `prisma/schema.prisma` (User model, after `focusAreas` at line ~41)
- Create: `src/lib/onboarding.ts`
- Create: `src/lib/__tests__/onboarding.test.ts`
- Modify: `src/app/actions/progress/preferences.ts:7-25`
- Modify: `src/components/OnboardingModal.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `PracticeIntent = 'interview' | 'upskill' | 'learn'`, `PRACTICE_INTENTS: { id: PracticeIntent; label: string; description: string }[]` in `@/lib/onboarding`; `saveUserPreferences(targetCompanies: string[], preferredDifficulty: string[], focusAreas: string[], practiceIntent?: string)` (4th param optional — existing callers stay valid); `User.practiceIntent: String @default("")` in the schema. Phase 3’s dashboard reordering reads `practiceIntent`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/onboarding.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PRACTICE_INTENTS, isPracticeIntent } from '@/lib/onboarding';

describe('PRACTICE_INTENTS', () => {
  it('covers the three market segments', () => {
    expect(PRACTICE_INTENTS.map((i) => i.id)).toEqual(['interview', 'upskill', 'learn']);
  });

  it('every intent has label and description', () => {
    for (const intent of PRACTICE_INTENTS) {
      expect(intent.label.length).toBeGreaterThan(0);
      expect(intent.description.length).toBeGreaterThan(0);
    }
  });
});

describe('isPracticeIntent', () => {
  it('accepts known ids and rejects unknowns', () => {
    expect(isPracticeIntent('interview')).toBe(true);
    expect(isPracticeIntent('upskill')).toBe(true);
    expect(isPracticeIntent('learn')).toBe(true);
    expect(isPracticeIntent('')).toBe(false);
    expect(isPracticeIntent('hacker')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/onboarding.test.ts`
Expected: FAIL — cannot resolve `@/lib/onboarding`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/onboarding.ts`:

```ts
export type PracticeIntent = 'interview' | 'upskill' | 'learn';

export const PRACTICE_INTENTS: { id: PracticeIntent; label: string; description: string }[] = [
  {
    id: 'interview',
    label: 'I have interviews coming up',
    description: 'Get interview-ready with timed practice and AI feedback.',
  },
  {
    id: 'upskill',
    label: "I'm leveling up as an engineer",
    description: 'Deepen your system design skills for your current role and the next one.',
  },
  {
    id: 'learn',
    label: "I'm learning system design from scratch",
    description: 'Start with fundamentals and a guided roadmap built for beginners.',
  },
];

export function isPracticeIntent(value: string): value is PracticeIntent {
  return PRACTICE_INTENTS.some((intent) => intent.id === value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/onboarding.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Schema + migration**

In `prisma/schema.prisma`, inside `model User`, add directly under `onboardingCompleted`:

```prisma
  practiceIntent       String   @default("")
```

Run: `pnpm prisma migrate dev --name add_practice_intent`
Expected: migration applied, client regenerated.

- [ ] **Step 6: Extend the server action**

In `src/app/actions/progress/preferences.ts`, change the signature and update data (keep everything else identical):

```ts
import { isPracticeIntent } from '@/lib/onboarding';

export async function saveUserPreferences(
  targetCompanies: string[],
  preferredDifficulty: string[],
  focusAreas: string[],
  practiceIntent: string = ''
) {
```

and in the `prisma.user.update` data block:

```ts
      data: {
        targetCompanies,
        preferredDifficulty,
        focusAreas,
        practiceIntent: isPracticeIntent(practiceIntent) ? practiceIntent : '',
        onboardingCompleted: true,
      },
```

- [ ] **Step 7: Add the intent step to OnboardingModal**

In `src/components/OnboardingModal.tsx`, the wizard grows from 3 steps to 4, with intent as the NEW step 1 (segments first — it frames the rest):

7a. Add imports and state:

```tsx
import { PRACTICE_INTENTS, type PracticeIntent } from '@/lib/onboarding';
```

```tsx
    const [selectedIntent, setSelectedIntent] = useState<PracticeIntent | null>(null);
```

7b. Update the progress bar denominator (line ~61): `animate={{ width: `${(step / 4) * 100}%` }}`.

7c. Insert the new step 1 panel as the first child inside `<AnimatePresence mode="wait">` (single-select — clicking a card sets it and advances):

```tsx
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">What brings you here?</DialogTitle>
                                    <DialogDescription className="text-lg">We&apos;ll tailor your dashboard to your goal.</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-3">
                                    {PRACTICE_INTENTS.map(intent => (
                                        <div
                                            key={intent.id}
                                            onClick={() => { setSelectedIntent(intent.id); setStep(2); }}
                                            className={`
                                        cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                                        ${selectedIntent === intent.id
                                                    ? 'border-primary bg-primary/10 shadow-sm'
                                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'}
                                    `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-lg font-semibold ${selectedIntent === intent.id ? 'text-primary' : ''}`}>{intent.label}</span>
                                                {selectedIntent === intent.id && <Check className="w-5 h-5 text-primary" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{intent.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
```

7d. Renumber the existing panels: companies `step === 1` → `step === 2` (key `"step2"`), difficulty `step === 2` → `step === 3` (key `"step3"`), focus areas `step === 3` → `step === 4` (key `"step4"`).

7e. Update the footer conditions (lines ~165–179): `step < 3` → `step < 4`, and pass the intent through in `handleFinish`:

```tsx
            const result = await saveUserPreferences(selectedCompanies, selectedDifficulty, selectedFocus, selectedIntent ?? '');
```

- [ ] **Step 8: Verify**

Run: `pnpm lint && pnpm vitest run src/lib/__tests__/onboarding.test.ts`
Expected: clean, PASS.

Manual check in dev with a fresh (or reset `onboardingCompleted=false`) user: modal opens with the intent question, clicking a card advances to companies, finishing persists — confirm in DB: `practiceIntent` set, `onboardingCompleted` true.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/onboarding.ts src/lib/__tests__/onboarding.test.ts src/app/actions/progress/preferences.ts src/components/OnboardingModal.tsx
git commit -m "feat(onboarding): capture practice intent (interview/upskill/learn) as first wizard step"
```

---

### Task 7: Remove vestigial `/home` route

Spec finding F9 (first half). `/u/[username]` stays untouched — its revival is Phase 3 item 3.4.

**Files:**
- Delete: `src/app/home/page.tsx` (and the now-empty `src/app/home/` directory)

- [ ] **Step 1: Confirm nothing links to `/home`**

Run: `grep -rn '"/home"' src/ --include='*.tsx' --include='*.ts'`
Expected: no matches outside `src/app/home/page.tsx` itself. If a match appears, update that link to `/` first.

- [ ] **Step 2: Delete the route**

```bash
rm -r src/app/home
```

- [ ] **Step 3: Verify the app still builds**

Run: `pnpm lint`
Expected: clean. In dev, `/home` now 404s (acceptable — it was never linked; the redirect existed for no traffic).

- [ ] **Step 4: Commit**

```bash
git add -A src/app/home
git commit -m "chore: remove vestigial /home redirect route"
```

---

## Final verification (after all tasks)

- [ ] Run the full unit suite: `pnpm vitest run` — expected: all green, including the four new test files.
- [ ] Run `pnpm build` — expected: compiles clean (env check permitting).
- [ ] Walk the five headline flows in dev: unified nav (desktop dropdowns + mobile parity incl. Pricing), `/whats-new` + bell dot lifecycle, `?interview=lite` upsell interstitial → `/pricing?feature=interviewMode` highlight, logged-out landing waitlist submit, fresh-user onboarding with intent step.
- [ ] Use superpowers:verification-before-completion before claiming done; then superpowers:requesting-code-review.
