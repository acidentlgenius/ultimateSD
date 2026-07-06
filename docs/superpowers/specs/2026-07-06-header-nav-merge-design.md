# Merge Learn + Practice nav groups & fix header overflow

## Problem

The header nav has 5 top-level items (Home, Learn, Practice, Interview, Pricing) plus a right-hand cluster (AI Powered Practice badge, notification bell, theme toggle, user menu). At certain viewport widths (around the `lg`/`xl` breakpoints) these collide: the Pricing link overlaps the right-side icons, and the notification bell overlaps the "AI Powered Practice" badge text.

Root cause: `Header.tsx` lays out `<div className="... grid-cols-[1fr_auto_1fr] ...">`. Grid tracks default to `min-width: auto`, sized to their content's intrinsic width. Neither the centered nav (auto column) nor the right-hand icon cluster (1fr column) can shrink below their natural width, so when the combined width exceeds the viewport, they overflow into each other instead of shrinking.

## Changes

### 1. Navigation data — `src/lib/navigation.ts`

Merge the `Learn` group (Roadmap, Guides) and `Practice` group (Problems, Custom Problem, Draw) into a single group:

- Label: `Practice`
- Icon: `Layers` (existing Practice icon)
- Links, in order: Roadmap, Guides, Problems, Custom Problem, Draw

This is the single source of truth (`NAV_ITEMS`) already consumed by both `NavDropdown` (desktop) and `flattenNavLinks()` (mobile), so both surfaces update automatically. Top-level nav item count drops from 5 to 4: Home, Practice, Interview, Pricing.

### 2. Header grid track fix — `src/components/Header.tsx`

Change the header's outer grid from:

```
grid-cols-[1fr_auto_1fr]
```

to:

```
grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
```

This lets the outer (logo and right-icon-cluster) tracks compress instead of forcing overflow, while leaving rendering unchanged when there's sufficient width.

## Out of scope

- No visual redesign of the dropdown, badge, or icon cluster.
- No changes to `MobileMenu.tsx` beyond what `flattenNavLinks()` already handles automatically.

## Verification

Run the dev server and check the header at 1024px, 1280px, and 1440px viewport widths (spanning the `lg`/`xl` breakpoints) to confirm the Pricing link, AI Powered Practice badge, and notification bell no longer overlap.
