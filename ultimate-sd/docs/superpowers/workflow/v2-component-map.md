# V2 Component Map
**Last updated:** 2026-07-10  
**Purpose:** Exact component tree so any developer knows which file owns what

---

## Component Tree

```
CanvasSessionUI                        src/features/problem-flow-v2/CanvasSessionUI.tsx
├── CanvasArea                         src/features/problem-flow-v2/CanvasArea.tsx
│   ├── [Infinite Canvas Wrapper]      (div 3200×1700 with camera transform)
│   │   ├── ProblemCard                src/features/problem-flow-v2/regions/ProblemCard.tsx
│   │   ├── FRRegion                   src/features/problem-flow-v2/regions/FRRegion.tsx
│   │   │   └── FRCard (×4)            (inline in FRRegion)
│   │   ├── NFRRegion                  src/features/problem-flow-v2/regions/NFRRegion.tsx
│   │   ├── EntitiesRegion             src/features/problem-flow-v2/regions/EntitiesRegion.tsx
│   │   │   ├── EntitySVG              (inline SVG for relationship lines)
│   │   │   └── EntityCard (×N)        (inline in EntitiesRegion)
│   │   ├── APIRegion                  src/features/problem-flow-v2/regions/APIRegion.tsx
│   │   ├── HLDRegion                  src/features/problem-flow-v2/regions/HLDRegion.tsx
│   │   │   ├── HLDArrowSVG            (inline SVG)
│   │   │   ├── HLDComponentBox (×N)   (inline in HLDRegion)
│   │   │   └── HLDArrowLabel (×N)     (inline in HLDRegion)
│   │   └── DeepDivesRegion            src/features/problem-flow-v2/regions/DeepDivesRegion.tsx
│   │       ├── AnnotationCircle (×N)  (inline)
│   │       └── DeepDiveList           (inline)
│   ├── TopBar                         src/features/problem-flow-v2/TopBar.tsx
│   │   ├── Breadcrumb                 (inline)
│   │   ├── ToolStrip                  (inline)
│   │   └── TimerCorner                (inline, conditional on timerVariant)
│   ├── BottomDock                     src/features/problem-flow-v2/BottomDock.tsx
│   └── StepExplainCard                src/features/problem-flow-v2/StepExplainCard.tsx
│       └── SeniorityPicker            (inline, stage 1 only)
└── GuideRail                          src/features/problem-flow-v2/GuideRail.tsx
    ├── RailHeader                     (inline)
    ├── RailContent                    (inline: tips + suggestions)
    └── RailFooter                     (inline: feedback + seniority + timer)
```

---

## Hooks

```
src/features/problem-flow-v2/hooks/
  useCanvasSession.ts     — master state manager (stage, maxStage, timer, rail, explain, fb)
  useCamera.ts            — pure function: (stage, vw, vh) → CSS transform string
  useCanvasContent.ts     — editable content state + localStorage persistence
```

---

## Data Layer

```
src/features/problem-flow-v2/data/
  canvas-types.ts         — all TypeScript interfaces
  canvas-data.ts          — ProblemCanvasData for all 40+ problems
  stage-meta.ts           — STAGE_META and CAMERA_REGIONS constants
```

---

## Component Contracts

### CanvasSessionUI
```typescript
interface CanvasSessionUIProps {
  problem: SystemDesignProblem;  // existing type from @/types
  existingProgress?: any;
  interviewAllowed?: boolean;
  probeEnabled?: boolean;
  voiceEnabled?: boolean;
}
```

### CanvasArea
```typescript
interface CanvasAreaProps {
  session: ReturnType<typeof useCanvasSession>;
  canvasData: ProblemCanvasData;
}
```

### GuideRail
```typescript
interface GuideRailProps {
  session: ReturnType<typeof useCanvasSession>;
  canvasData: ProblemCanvasData;
}
```

### Region Components (all share same pattern)
```typescript
interface RegionProps {
  canvasData: ProblemCanvasData;
  session: ReturnType<typeof useCanvasSession>;
  // content: ReturnType<typeof useCanvasContent>;  // pass from CanvasArea
}
```

---

## State Ownership

| State | Owner | Consumers |
|---|---|---|
| stage, maxStage | useCanvasSession | TopBar, BottomDock, GuideRail, StepExplainCard, all regions (visibility) |
| canvasContent | useCanvasContent | FRRegion, NFRRegion, EntitiesRegion, APIRegion, HLDRegion, DeepDivesRegion |
| vw, vh | useCanvasSession (ResizeObserver) | useCamera |
| seniority | useCanvasSession (localStorage) | GuideRail (suggestions), FRRegion (default content), StepExplainCard |
| fb (feedback state) | useCanvasSession | GuideRail footer |
| railOpen | useCanvasSession | layout (conditional GuideRail render), vw recalc |
| explainOpen | useCanvasSession | StepExplainCard |
| timer (seconds, paused) | useCanvasSession | TimerCorner, RailFooter |

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/ai/canvas-feedback` | POST | AI reads canvas content, returns FeedbackNote[] |
| `/api/practice/canvas-progress` | POST | Save canvasSnapshot + canvasStage to ProblemProgress |
| `/api/practice/canvas-progress` | GET | Load existing canvasSnapshot for a problem |

---

## Existing Components NOT to modify

| Component | Location | Reason |
|---|---|---|
| PracticeUI | src/components/PracticeUI.tsx | V1, must remain intact |
| StepByStepChat | src/components/StepByStepChat.tsx | V1, untouched |
| DiagramCanvas | src/components/DiagramCanvas.tsx | V1, untouched |
| TimerWidget | src/components/TimerWidget.tsx | Reusable, V2 has its own inline timer |
| HelpAssistant | src/components/HelpAssistant.tsx | V1 only |

---

## File Creation Order (matches Phase plan)

```
Phase 1:
  data/canvas-types.ts
  data/canvas-data.ts       ← most work, per-problem data
  data/stage-meta.ts

Phase 2:
  hooks/useCamera.ts
  hooks/useCanvasSession.ts
  CanvasSessionUI.tsx
  CanvasArea.tsx
  TopBar.tsx
  BottomDock.tsx

Phase 3:
  GuideRail.tsx

Phase 4:
  regions/ProblemCard.tsx
  regions/FRRegion.tsx
  regions/NFRRegion.tsx
  regions/EntitiesRegion.tsx
  regions/APIRegion.tsx
  regions/HLDRegion.tsx
  regions/DeepDivesRegion.tsx
  StepExplainCard.tsx

Phase 5:
  hooks/useCanvasContent.ts
  (API routes in src/app/api/)

Phase 6:
  index.ts                  ← re-export CanvasSessionUI
  (feature flag edits)
  (prisma schema edit)
```

---

## CSS Animations (add to globals.css)

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes shimmer {
  0%   { opacity: .35; }
  50%  { opacity: .7; }
  100% { opacity: .35; }
}
```

Check if these already exist in globals.css before adding.
