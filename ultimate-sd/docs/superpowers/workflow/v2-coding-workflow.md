# V2 Coding Workflow
**Last updated:** 2026-07-10  
**Purpose:** Step-by-step guide for how to actually implement V2 without going off track

---

## Before You Write a Single Line

1. **Read the spec fully:** `docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md`
2. **Open the canvas prototype:** `# Ultimate SD Canvas Redesign/Canvas Session.dc.html` — view it in a browser. This is the source of truth for any pixel-level question.
3. **Check the screenshot:** `# Ultimate SD Canvas Redesign/uploads/Screenshot 2026-07-11 003624.png` — this is what V1 currently looks like. V2 must NOT look like this.
4. **Check memory:** `memory/MEMORY.md` for any learnings from previous sessions.

---

## Environment Setup

```bash
cd ultimate-sd
pnpm dev   # start dev server

# In a second terminal:
npx tsc --noEmit --watch   # TypeScript type checking in watch mode
```

The dev server uses Turbopack (based on the .next/dev structure). Hot reload is fast.

---

## Session Start Ritual

Every coding session, run:
```bash
# Check what's changed
git status
git log --oneline -10

# Check if TypeScript is clean
npx tsc --noEmit
```

Then update `memory/recent-changes.md` with what you're about to do.

---

## Phase 1 Workflow: Types and Data

### Step 1: Create the type file

Create `src/features/problem-flow-v2/data/canvas-types.ts` with ALL interfaces from the plan (Section 1.1).

Run: `npx tsc --noEmit` → must be zero errors.

### Step 2: Start canvas-data.ts with ONE problem

Start with YouTube only. Do NOT try to do all 40+ at once.

```typescript
// canvas-data.ts - start here
export const CANVAS_DATA: Record<string, ProblemCanvasData> = {
  'design-youtube': {
    slug: 'design-youtube',
    problem: {
      title: 'Design YouTube',
      context: 'A video platform where creators upload videos...',
      // ... copy from spec Section 8.1
    },
    // ... all sections
  }
};
```

Run tests: `getCanvasData('design-youtube')` should return the full object. `getCanvasData('design-tinyurl')` should return `null` (not in map yet).

### Step 3: Add one problem at a time

Add TinyURL, then Twitter, then Uber. After each addition, run TypeScript check.

**Rule:** Never add a problem with missing fields. TypeScript will catch it because `ProblemCanvasData` has required fields. If you're unsure what data to use, derive it from the existing `PROBLEM_STEPS` in `src/lib/problem-steps.ts` — it has per-problem content that can be translated to the new format.

### Step 4: Stub remaining problems

For problems not yet fully specified, create a stub that passes TypeScript but uses placeholder data:

```typescript
const STUB_PROBLEM: ProblemCanvasData = {
  slug: 'design-dropbox',
  problem: { title: 'Design Dropbox', context: '...', scopeNote: '...' },
  fr: { beginner: ['Sync files'], midLevel: ['...'], senior: ['...'], outOfScope: ['...'] },
  nfr: { bullets: [{ text: 'TBD' }] },
  entities: { boxes: [], relationships: [] },
  api: { endpoints: [{ method: 'GET', path: '/files' }] },
  hld: { components: [], arrows: [] },
  deepDives: { circles: [], items: [{ text: 'TBD' }] },
  guide: {},
  feedback: {}
};
```

Stubs are better than gaps. They won't crash the UI.

---

## Phase 2 Workflow: Canvas Shell

### Step 1: Build useCanvasSession first

This hook is the central nervous system. Get it right before building any UI.

Test it in isolation with a simple test page:
```tsx
// src/app/dev/flow-v2/page.tsx (already exists in .next — fill it in)
'use client';
import { useCanvasSession } from '@/features/problem-flow-v2/hooks/useCanvasSession';

export default function DevPage() {
  const session = useCanvasSession('design-youtube');
  return (
    <div style={{ background: '#0e0f12', color: '#e8e9eb', padding: 20, height: '100vh' }}>
      <pre>{JSON.stringify({ stage: session.state.stage, maxStage: session.state.maxStage, vw: session.state.vw }, null, 2)}</pre>
      <button onClick={() => session.actions.goTo(session.state.stage + 1)}>→</button>
      <button onClick={() => session.actions.goTo(session.state.stage - 1)}>←</button>
    </div>
  );
}
```

Open `localhost:3000/dev/flow-v2` to test.

### Step 2: Build the canvas wrapper

```tsx
// Verify the camera transform produces correct values
// Stage 0: should center on problem card (left=120-590px area)
// Stage 5: should show the HLD region (left=1870-2900px)
console.log(useCamera(0, 1400, 800));  // eyeball the transform
console.log(useCamera(5, 1400, 800));  // should be different, focused on HLD area
```

### Step 3: Add TopBar and BottomDock

These are purely visual. Implement them as dumb components that receive `session.state` and action callbacks.

**Critical:** The breadcrumb and bottom dock must be `position: absolute` inside `CanvasArea`, NOT in the flex row. They float over the canvas.

### Step 4: Verify camera pan

The `transition: transform .7s cubic-bezier(.22,1,.36,1)` must be on the 3200×1700 wrapper div, not on the CanvasArea. Press ←→ and confirm the canvas slides to the correct region.

---

## Phase 3 Workflow: Guide Rail

### Step 1: Build static rail first

Hardcode the stage 0 tips and suggestions. Get the visual right first.

### Step 2: Wire to session state

Connect tips and suggestions to `canvasData.guide[session.state.stage]`.

### Step 3: Build the three feedback states

Implement idle → loading → done state machine. Use a static timeout (1.4s) before checking live AI.

**The shimmer animation must use `animation: shimmer 1.2s infinite` with the staggered delay for the second line.**

---

## Phase 4 Workflow: Regions

### Critical Rule: One region per day, test before moving on

Do NOT implement all 7 regions in one shot. The details matter. Each region should match the canvas prototype exactly before proceeding to the next.

### Region Testing Protocol

For each region, verify:
1. Exact position (left, top, width) matches spec
2. Fonts: heading = Caveat 26px 600wt, cards = Caveat 22px, code = Geist Mono 13.5px
3. Colors: primary text #e8e9eb, secondary #b3b6bf, muted #8a8d96
4. Border radius: irregular values (e.g., "6px 9px 7px 8px") not uniform
5. Rotation: slight rotations on all cards (±0.3–0.6deg)
6. Animation: `animation: fadeIn .5s ease` on the region wrapper

### HLD Region — Special Care

The SVG arrows are the hardest part. Before coding:
1. Open the canvas prototype in a browser
2. Inspect the exact SVG paths in DevTools
3. Cross-reference with spec Section 5, Region 5

The arrow marker `id="arr"` must be defined in a `<defs>` block inside the SVG. Use `url(#arr)` as the `markerEnd`. If you have multiple HLD regions (not the case, but future-proofing), use unique marker IDs.

**Dashed lines:** `strokeDasharray="6 5"` for async paths (e.g., CDN to object store in YouTube HLD).

**Bidirectional lines:** Apply `markerStart="url(#arr)"` in addition to `markerEnd`.

---

## Phase 5 Workflow: AI + Persistence

### AI Route

Start with static fallback feedback (the arrays in `canvasData.feedback`). Only connect to live AI if the static feedback is working correctly.

When connecting to AI:
- Reuse the existing AI client from `src/lib/langgraph.ts` or `src/app/api/ai/evaluate/route.ts`
- Do NOT build a new AI client from scratch
- The prompt template is in the plan (Section 5.1)

### Persistence

Extend the Prisma schema CAREFULLY:
```prisma
// Only add the two new optional fields
model ProblemProgress {
  // ... all existing fields UNCHANGED ...
  canvasSnapshot   Json?  // add at end
  canvasStage      Int?   // add at end
}
```

Run: `pnpm prisma migrate dev --name add_canvas_snapshot`

**Do NOT touch any existing ProblemProgress fields.**

---

## Phase 6 Workflow: Feature Flag

### Enabling V2 for your account

In the admin panel (`/admin`), find the feature flags section. Enable `problemFlowV2` for your user ID.

OR via database:
```sql
-- Neon console
INSERT INTO "FeatureFlag" (user_id, feature, enabled)
VALUES ('your-user-id', 'problemFlowV2', true)
ON CONFLICT DO UPDATE SET enabled = true;
```

### Testing the flag switch

Test both states:
- Flag OFF → `/practice/design-youtube` renders V1 (PracticeUI)
- Flag ON → `/practice/design-youtube` renders V2 (CanvasSessionUI)
- Mobile width → V2 falls back to V1 even with flag ON

---

## Debugging Tips

### Camera transform debugging

Add this temporarily to verify camera positions:
```tsx
// In CanvasArea.tsx, temporarily:
<div style={{ position: 'absolute', left: 10, top: 100, zIndex: 100, color: 'lime', fontSize: 12, fontFamily: 'monospace' }}>
  stage={stage} transform={cameraTransform.slice(0, 50)}
</div>
```

### Region visibility debugging

To force all regions visible during development:
```tsx
// In CanvasArea.tsx, temporarily change:
{session.state.maxStage >= 1 && <FRRegion ... />}
// to:
{true && <FRRegion ... />}
```

Remember to revert before committing.

### ContentEditable + React

`contentEditable` divs in React require:
```tsx
<div
  contentEditable
  suppressContentEditableWarning  // required to suppress React warning
  onBlur={(e) => save(e.currentTarget.textContent ?? '')}
>
```

Do NOT use `onChange` with contentEditable — it fires too frequently. Use `onBlur`.

### Font loading check

Verify Caveat is loaded:
```javascript
// In browser console:
document.fonts.ready.then(() => console.log([...document.fonts].map(f => f.family)))
```

Should include `"Caveat"` in the list.

---

## Pre-commit Checklist

Before every commit:
- [ ] `npx tsc --noEmit` → zero errors
- [ ] `pnpm test --passWithNoTests` → tests pass
- [ ] V1 (`/practice/design-youtube` with flag OFF) still works
- [ ] V2 (`/practice/design-youtube` with flag ON) renders correctly
- [ ] Update `memory/recent-changes.md` with what changed

---

## Escalation: When Things Don't Match the Design

If a component doesn't look right, check in this order:
1. Re-read the spec section for that component
2. Open the canvas prototype HTML and compare the exact CSS
3. Use browser DevTools to measure the prototype's computed styles
4. If still unclear, ask (don't guess and ship)

The spec is the law. The prototype HTML is the arbiter. `recent-changes.md` records all deviations.
