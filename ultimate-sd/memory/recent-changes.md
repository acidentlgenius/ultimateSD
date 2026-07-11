---
name: recent-changes
description: Audit log of all changes made to the project — updated each session
metadata:
  type: project
---

# Recent Changes Audit

> Format: `[date] [file] — what changed and why`

---

## 2026-07-10 / 2026-07-11 — V2 Canvas Spec + Planning Session

### Documentation Created

- **`docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md`** (NEW ~700 lines)
  Pixel-exact V2 spec. Replaces all prior conceptual V2 descriptions. Contains:
  - Full design token table (colors, fonts, sizes)
  - 7-stage definitions with budgets and camera regions
  - Exact canvas region positions (left/top/width/height in canvas coordinates)
  - Camera transform formula from prototype
  - TypeScript interface definitions (CanvasSessionState, ProblemCanvasData, etc.)
  - Full per-problem data for YouTube, TinyURL, Twitter, Uber, WhatsApp, Rate Limiter
  - Stub notes for 15+ additional problems
  - Feature flag integration spec
  - What stays unchanged (V1 paths, component library, auth, DB)

- **`docs/superpowers/plans/2026-07-10-problem-flow-v2.md`** (NEW ~400 lines)
  6-phase implementation plan. Key sections:
  - Failure analysis: why previous plans failed (too abstract, no per-problem data, no camera formula)
  - Phase 1: canvas-types.ts + canvas-data.ts
  - Phase 2: Canvas shell (useCamera, useCanvasSession, CanvasSessionUI, CanvasArea, TopBar, BottomDock)
  - Phase 3: GuideRail with 3-state feedback
  - Phase 4: 7 region components
  - Phase 5: AI + persistence (API routes, Prisma schema)
  - Phase 6: feature flag + polish
  - Testing checklist + common mistakes

- **`docs/superpowers/workflow/v2-component-map.md`** (NEW)
  Full component tree (ASCII), hooks, data layer, component TypeScript contracts, state ownership table, API routes, existing components NOT to modify, file creation order by phase, CSS animations to add.

- **`docs/superpowers/workflow/v2-coding-workflow.md`** (NEW)
  Developer workflow guide: pre-work checklist, environment setup, session start ritual, phase-by-phase steps, debugging tips, pre-commit checklist, escalation process.

- **`docs/superpowers/workflow/v2-prod-checklist.md`** (NEW)
  Tiered production readiness checklist: Tier 1 (blocking), Tier 2 (1 week), Tier 3 (post-launch). Rollout strategy (A→B→C→D phases). Monitoring signals. Rollback plan.

### Memory System Created

- **`memory/MEMORY.md`** (NEW)
  High-level index pointing to all memory files. Loaded in every conversation.

- **`memory/project-v2-canvas.md`** (NEW)
  V2 project context: what it is, what changes vs V1, what stays the same, design source paths.

- **`memory/project-platform-arch.md`** (NEW)
  Tech stack reference: Next.js 14, Prisma/Neon, pnpm, auth, feature flags, key source paths.

- **`memory/feedback-spec-gap.md`** (NEW)
  Lesson: specs must be pixel-exact with per-problem data or implementation drifts.

- **`memory/feedback-implementation-drift.md`** (NEW)
  Lesson: V2 code must stay in `src/features/problem-flow-v2/`, never import V1 UI.

- **`memory/feedback-data-first.md`** (NEW)
  Lesson: per-problem canvas data must exist before any UI region is considered done.

- **`memory/tech-camera-transform.md`** (NEW)
  Technical reference: exact camera formula, transformOrigin constraint, ResizeObserver pattern.

- **`memory/tech-contenteditable.md`** (NEW)
  Technical reference: contentEditable pattern for canvas text areas, placeholder CSS, gotchas.

- **`memory/recent-changes.md`** (THIS FILE — NEW)
  Audit log of all changes.

### Files Read (not modified)

- `ultimate-sd/# Ultimate SD Canvas Redesign/Canvas Session.dc.html` — authoritative prototype; extracted camera regions, stage definitions, JS logic
- `src/app/practice/[slug]/page.tsx` — practice page; confirmed V2 integration point
- `src/lib/problem-steps.ts` — V1 step data; reference for bootstrapping V2 canvas data
- `src/lib/steps.ts` — generic fallback steps
- `src/components/PracticeUI.tsx` — V1 UI; confirmed must not be modified
- `ultimate-sd/# Ultimate SD Canvas Redesign/uploads/Screenshot 2026-07-11 003624.png` — current V1 UI screenshot

---

---

## 2026-07-11 — V2 Phase 1–6 Implementation (continued session)

### Memory Files Completed

- **`memory/tech-camera-transform.md`** (NEW) — exact camera formula, transformOrigin constraint, ResizeObserver pattern
- **`memory/tech-contenteditable.md`** (NEW) — contentEditable pattern, placeholder CSS, gotchas
- **`memory/recent-changes.md`** (THIS FILE — updated)

### V2 Code Created

All files in `src/features/problem-flow-v2/`:

- **`data/canvas-types.ts`** — All TypeScript interfaces: `CanvasSessionState`, `ProblemCanvasData`, `CameraRegion`, `StageMeta`, `StageGuideContent`, `CanvasSnapshot`, `CanvasContent`, and all sub-types
- **`data/canvas-data.ts`** — `STAGE_META` (7 stages), `CAMERA_REGIONS` (7 camera positions from prototype), `CANVAS_DATA` map with full per-problem data for YouTube/TinyURL/Twitter/Uber/WhatsApp/Rate Limiter, typed stubs for 15+ more problems, `getCanvasData()` helper
- **`hooks/useCamera.ts`** — pure camera transform calculation using prototype formula, ResizeObserver for accurate container dimensions
- **`hooks/useCanvasSession.ts`** — master state machine (reducer pattern): stage, maxStage, timer, seniority, explain card, guide rail, AI feedback states
- **`hooks/useCanvasContent.ts`** — contentEditable text persistence with debounced save to `/api/canvas/progress`
- **`CanvasSessionUI.tsx`** — V2 root component, composes all chrome + canvas
- **`CanvasArea.tsx`** — 3200×1700 canvas with CSS transform camera, `visibility:hidden` (not unmount) for progressive regions
- **`TopBar.tsx`** — 52px fixed top chrome: title, stage breadcrumb, timer, seniority picker, guide toggle
- **`BottomDock.tsx`** — 56px fixed bottom chrome: prev/next navigation, stage dots
- **`GuideRail.tsx`** — 292px right panel: FOCUS ON tips, WORTH CONSIDERING suggestions, 3-state AI feedback (idle/loading shimmer/done)
- **`StepExplainCard.tsx`** — modal overlay on stage entry, dismissed by "Got it" or Esc, auto-starts timer
- **`regions/shared.tsx`** — shared design tokens, `RegionLabel`, `EditableArea`, `StickyCard`
- **`regions/ProblemRegion.tsx`** — left=120, top=170; collapsible problem card
- **`regions/FRRegion.tsx`** — left=690, top=150; 4 sticky-note cards (3 in-scope + 1 out-of-scope)
- **`regions/NFRRegion.tsx`** — left=690, top=420; scale hints + contentEditable list
- **`regions/EntitiesRegion.tsx`** — left=1250, top=150; entity cards with SVG relationship lines
- **`regions/APIRegion.tsx`** — left=1250, top=600; Geist Mono code block, editable
- **`regions/HLDRegion.tsx`** — left=1870, top=120; component boxes + SVG curved arrows with arrowhead marker
- **`regions/DeepDiveRegion.tsx`** — left=1870, top=790; deep dive topic cards with user notes
- **`index.ts`** — barrel export

### API Routes Created

- **`src/app/api/canvas/feedback/route.ts`** — POST: LangChain/Claude Haiku stage feedback (label + body)
- **`src/app/api/canvas/progress/route.ts`** — POST: upsert canvas snapshot; GET: load snapshot

### Modified Files

- **`prisma/schema.prisma`** — Added `canvasSnapshot Json?` and `canvasStage Int?` to `ProblemProgress` model
- **`src/lib/plans.ts`** — Added `problemFlowV2` to `FEATURE_KEYS`, `FEATURE_SEED_DEFAULTS`, `FEATURE_INTENDED_PLANS`
- **`src/lib/feature-upsell.ts`** — Added `problemFlowV2` upsell copy
- **`src/app/practice/[slug]/page.tsx`** — Added V2 feature flag branch: checks `problemFlowV2` flag + mobile detection, dynamically imports `CanvasSessionUI`, passes snapshot
- **`src/app/globals.css`** — Added `@keyframes canvasFadeIn`, `@keyframes shimmer`, contentEditable placeholder CSS

### Notes for Next Session

- Run `prisma generate` locally after pulling — the sandbox couldn't reach Prisma CDN
- Run `prisma migrate dev --name add-canvas-snapshot` to create the DB migration
- The `@ts-ignore` casts in `canvas/progress/route.ts` and `practice/[slug]/page.tsx` will auto-resolve after `prisma generate`
- Test V2 with: add a `FeatureFlagOverride` row for your user with `flagKey='problemFlowV2'` and `mode='on'`
- Caveat font needs to be loaded in `layout.tsx` — add `next/font/google` import for `Caveat`

---

---

## 2026-07-11 — Session 3: V2 Critical Bug Fixes

### Root cause analysis

User tested V2 and reported two critical failures visible in screenshots:

**Bug 1 — Pre-filled canvas:** FRRegion, NFRRegion, APIRegion, EntitiesRegion, and HLDRegion
all pre-populated their editable areas with per-problem data from `canvas-data.ts`.
User had nothing to fill in — they were reading, not solving.

**Bug 2 — Region visual overlap:** The infinite canvas camera correctly positions each stage
region, but the viewport is wide enough to show adjacent regions simultaneously. Without
dimming, all visible regions appeared at full opacity, creating the broken/cluttered look.

### Files Changed

- **`regions/FRRegion.tsx`** — Removed `suggestions`/`defaults` computation. All 4 cards
  now start blank (`initialValue={content.content[slot.key] ?? ''}`). Guide rail hint updated
  to say "hints → guide rail".

- **`regions/NFRRegion.tsx`** — Removed `defaultText = data.items.join('\n')`. NFR list
  now starts blank (only restores saved content). Scale hints remain read-only (they're
  math/context, not answers).

- **`regions/APIRegion.tsx`** — Removed `formatEndpoints(data)` function and `defaultText`.
  API code block starts blank. Removed unused `APIStageData` usage.

- **`regions/EntitiesRegion.tsx`** — Complete rewrite. Was: rendered pre-filled entity cards
  from per-problem data. Now: 4 blank card frames with two contentEditable areas each
  (entity name + fields block). Keys: `entities.${i}.name`, `entities.${i}.fields`.
  Added `overflow: hidden` to prevent text bleed into adjacent regions.

- **`regions/HLDRegion.tsx`** — Complete rewrite. Was: rendered pre-drawn architecture
  from `data.hld.components` (client, API gateway, services etc.). Now: 6 blank scaffold
  boxes in a pipeline+storage layout with fixed SVG arrows. User types component names.
  Added user notes area below for design decisions/trade-offs. Added `overflow: hidden`.
  Keys: `hld.${i}.label`, `hld.${i}.sublabel`, `hld.notes`.

- **`CanvasArea.tsx`** — RegionSlot redesigned with `stageIndex` and `currentStage` props.
  Opacity now dims by distance from active stage:
  - dist=0 (active): opacity 1.0
  - dist=1 (adjacent): opacity 0.28
  - dist≥2 (far): opacity 0.08
  - not revealed: visibility: hidden
  `pointerEvents: none` on non-active regions prevents accidental edits in dim regions.

---

## 2026-07-11 — Session 4: Dynamic regions + drag/pan

### Critical feedback
Screenshot showed:
1. "Dynamic components are not dynamic" — FR/entity cards couldn't be added
2. "Core entities is broken, not dynamic" — entities needed to be created manually  
3. "HLD is fully broken" — blank scaffold boxes were confusing and static
4. "Visibility is low" — opacity values too dim
5. "Focus is not correct" — far-away stage regions were visible but confusing
6. "I'm unable to drag" — no pan/drag capability on canvas

### Files Changed

- **`hooks/useCamera.ts`** — Added `panOffset: {x, y}` parameter (canvas-coordinate offset
  applied additionally to stage transform). Now returns `scale: number` so CanvasArea can
  convert screen-pixel drag deltas to canvas-coordinate pan. Pan formula: `dx / s`.

- **`CanvasArea.tsx`** — Added full drag/pan with mouse handlers. `mousedown` on canvas
  background (not contentEditable/button) starts pan. `mousemove` accumulates delta/scale.
  `mouseup`/`mouseleave` stops. Cursor changes grab→grabbing. Pan resets on stage change.
  Opacity fixed: dist≥2 → 0 (completely hidden, no visual clutter), dist=1 → 0.4.

- **`regions/FRRegion.tsx`** — Complete rewrite for dynamic cards.
  - State: `fr.cardCount` (default 4, max 8), `fr.card${i}.del` (deleted marker)
  - Cards add via "+ Add requirement" button; remove via × per card
  - Out-of-scope toggle (⊘) per card
  - Positions array supports 8 cards (extra rows below existing 4)

- **`regions/EntitiesRegion.tsx`** — Complete rewrite for dynamic entities.
  - State: `entities.count` (default 1), `entities.${i}.del` (deleted marker)
  - Starts with 1 blank card; "+ Add entity" button adds more (max 8)
  - 2-column layout; each card: editable name + editable fields (pre-wrap)
  - First entity card highlighted with accent border

- **`regions/HLDRegion.tsx`** — Complete redesign: three-lane diagram builder.
  - Three lanes: Clients → Services → Storage/Infra
  - Each lane has dynamic component boxes with "+" per-lane add button
  - SVG arrows between lanes (labeled "requests" and "reads/writes")
  - Dashed vertical dividers between lanes
  - Notes area below diagram for trade-offs and design decisions
  - State: `hld.{client|service|storage}.count`, `hld.{lane}.${i}.label`, `hld.notes`

### Design principle enforced

Per-problem data in `canvas-data.ts` serves TWO purposes only:
1. Guide rail hints/suggestions (already correct — unchanged)
2. AI feedback reference architecture (already correct — unchanged)

Canvas editable areas ALWAYS start blank. The user fills them in. That's the product.

---

## V2 Implementation Status (as of 2026-07-11, session 2)

| Component | Status |
|-----------|--------|
| Spec | ✅ Done |
| Plan | ✅ Done |
| Workflow docs | ✅ Done |
| Memory system | ✅ Done |
| canvas-types.ts | ✅ Done |
| canvas-data.ts | ✅ Done (6 core + 15 stubs) |
| useCamera.ts | ✅ Done |
| useCanvasSession.ts | ✅ Done |
| useCanvasContent.ts | ✅ Done |
| CanvasSessionUI.tsx | ✅ Done |
| CanvasArea.tsx | ✅ Done |
| TopBar.tsx | ✅ Done |
| BottomDock.tsx | ✅ Done |
| GuideRail.tsx | ✅ Done |
| StepExplainCard.tsx | ✅ Done |
| 7 Region components | ✅ Done |
| AI feedback API route | ✅ Done |
| Canvas progress API route | ✅ Done |
| Prisma schema fields | ✅ Done (needs `prisma migrate` locally) |
| Feature flag wiring | ✅ Done |
| Caveat font loading | ✅ Done (`layout.tsx` updated) |
| DB migration file | ✅ Done (`prisma/migrations/20260711000000_add_canvas_snapshot/`) |
| `prisma generate` locally | ⚠️ Run after pulling (sandbox can't reach Prisma CDN) |
| `prisma migrate deploy` locally | ⚠️ Run to apply the migration SQL |
| Per-problem data: Netflix | ✅ Done |
| Per-problem data: Instagram | ✅ Done |
| Per-problem data: Google Search, Dropbox, others | ⚠️ Stubs — fill per spec priority order |
