---
name: feedback-implementation-drift
description: Without guard rails, V2 implementation drifts to V1 form approach — feature flag is the boundary
metadata:
  type: feedback
---

# Implementation Drift

## Rule
V2 code must live exclusively in `src/features/problem-flow-v2/`. The feature flag in `src/app/practice/[slug]/page.tsx` is the ONLY connection between V1 and V2.

**Why:** When implementing V2 components, it's tempting to reuse V1 components (StepByStepChat, DiagramCanvas, HelpAssistant) which brings back the V1 UX. V2 must be a clean feature module.

**What's allowed to be shared:**
- `src/lib/` utilities (Prisma, auth, feature flags, analytics)
- `src/components/ui/` (shadcn/ui primitives: Button, Dialog, etc.)
- TypeScript types from `src/types/`
- Auth session from `useSession`

**What must NOT be imported into V2:**
- `PracticeUI` → would render V1 layout inside V2
- `StepByStepChat` → V1's AI chat interface
- `DiagramCanvas` → V1's Excalidraw integration
- `HelpAssistant` → V1's help panel
- `TimerWidget` → V1's timer widget (V2 has its own inline timer)

## How to Apply
Before importing anything in a V2 file, ask: "Is this V1 UI or V2 UI?" If V1 UI, don't import it — implement an equivalent in V2.

The existing `widgetId` system (Excalidraw widgets like `'abr-simulator'`, `'cache-visualizer'`) IS okay to embed inside canvas regions — but wrap them in the V2 region styling, not V1's widget panel.
