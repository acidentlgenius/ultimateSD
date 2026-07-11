# Problem Flow V2 — Implementation Plan
**Date:** 2026-07-10  
**Depends on:** `docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md`  
**Previous attempts failed because:** Plan was too abstract, didn't specify exact file paths, component APIs, or data shapes. This plan is implementation-ready.

---

## Failure Analysis (Why V1 Plan Didn't Work)

1. **No exact component tree** — developers had to guess what components to create
2. **No TypeScript interfaces** — canvas data shape was invented per-component, leading to inconsistency
3. **No per-problem data** — all problems got the same generic steps, not the YouTube-specific entities/HLD/deep-dives shown in the design
4. **No camera system** — the infinite canvas concept wasn't translated into actual CSS transform code
5. **No guard rails** — implementation drifted back to V1's form approach because no boundary said "this region must look exactly like this"

---

## Plan Overview

This plan is broken into **6 phases**. Each phase is independently shippable and testable. Complete them in order — later phases depend on earlier ones.

### Phase Dependency Map
```
Phase 1 (Types + Data)
  ↓
Phase 2 (Canvas Shell) ←→ Phase 3 (Guide Rail)
  ↓
Phase 4 (Regions: FR, NFR, Entities, API, HLD, DeepDives)
  ↓
Phase 5 (AI Integration + Persistence)
  ↓
Phase 6 (Feature Flag + Polish)
```

---

## Phase 1: Types and Data (Day 1)

**Goal:** All TypeScript types defined and all per-problem canvas data created. Nothing renders yet.

### 1.1 Create `canvas-types.ts`

File: `src/features/problem-flow-v2/data/canvas-types.ts`

```typescript
export type Seniority = 'Beginner' | 'Mid-level' | 'Senior';
export type FeedbackState = 'idle' | 'loading' | 'done';
export type TimerVariant = 'corner' | 'hover' | 'rail';

export interface FeedbackNote {
  tag: '✓' | '△' | '○';
  text: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  comment?: string;
}

export interface EntityField {
  name: string;
  fields: string[];
  highlighted: boolean;  // true = #8f95f2 border
  position: { left: number; top: number; width: number };
  rotation: number;
}

export interface EntityRelationship {
  from: string;
  to: string;
  cardinality: string;
  line: { x1: number; y1: number; x2: number; y2: number };
}

export interface HLDComponent {
  name: string;
  subtitle?: string;
  position: { left: number; top: number; width: number };
  rotation: number;
  highlighted: boolean;
}

export interface HLDArrow {
  x1: number; y1: number;
  x2: number; y2: number;
  dashed?: boolean;
  bidir?: boolean;  // bidirectional (marker-start AND marker-end)
  label?: {
    text: string;
    position: { left: number; top: number };
    rotation?: number;
  };
}

export interface DeepDiveCircle {
  position: { left: number; top: number; width: number; height: number };
  label: { text: string; position: { left: number; top: number }; rotation?: number };
  rotation?: number;
}

export interface NFRBullet {
  text: string;
  annotation?: string;  // text shown in #8f95f2 (accent color) appended after bullet
}

export interface CameraRegion {
  cx: number;
  cy: number;
  fitW: number;
  fitH: number;
  maxS: number;
}

export interface GuideStageData {
  tips: string[];
  suggestions: string[] | null;
  frSuggestions?: {
    beginner: string[];
    midLevel: string[];
    senior: string[];
  };
}

export interface ProblemCanvasData {
  slug: string;
  isOOD?: boolean;  // true for Parking Lot, Elevator, LRU Cache
  
  problem: {
    title: string;
    context: string;
    scopeNote: string;
  };
  
  fr: {
    beginner: string[];
    midLevel: string[];
    senior: string[];
    outOfScope: string[];
  };
  
  nfr: {
    bullets: NFRBullet[];
  };
  
  entities: {
    boxes: EntityField[];
    relationships: EntityRelationship[];
  };
  
  api: {
    endpoints: APIEndpoint[];
  };
  
  hld: {
    components: HLDComponent[];
    arrows: HLDArrow[];
  };
  
  deepDives: {
    circles: DeepDiveCircle[];
    items: Array<{ text: string }>;
  };
  
  guide: Record<number, GuideStageData>;
  
  feedback: Partial<Record<number, FeedbackNote[]>>;
}

// Editable user content per session
export interface CanvasContent {
  fr: string[];           // user-edited FR items
  nfr: string[];          // user-edited NFR bullets
  entities: Array<{
    name: string;
    fields: string[];
  }>;
  api: string;            // raw text of API block
  hldNotes: string;       // free-form notes on HLD
  deepDiveNotes: string[];  // per-item notes
}

// Stage state
export interface CanvasSessionState {
  stage: number;
  maxStage: number;
  explainOpen: boolean;
  understood: Record<number, boolean>;
  fb: FeedbackState;
  fbNotes: FeedbackNote[];
  seconds: number;
  paused: boolean;
  timerShown: boolean;
  railOpen: boolean;
  seniority: Seniority;
  vw: number;
  vh: number;
  problemCollapsed: boolean;
  canvasContent: CanvasContent;
}
```

### 1.2 Create `canvas-data.ts`

File: `src/features/problem-flow-v2/data/canvas-data.ts`

```typescript
import { ProblemCanvasData } from './canvas-types';

const YOUTUBE_DATA: ProblemCanvasData = { /* ... exact data from spec Section 8.1 ... */ };
const TINYURL_DATA: ProblemCanvasData = { /* ... exact data from spec Section 8.2 ... */ };
const TWITTER_DATA: ProblemCanvasData = { /* ... exact data from spec Section 8.3 ... */ };
const UBER_DATA: ProblemCanvasData = { /* ... exact data from spec Section 8.4 ... */ };
const WHATSAPP_DATA: ProblemCanvasData = { /* ... exact data from spec Section 8.5 ... */ };
const RATE_LIMITER_DATA: ProblemCanvasData = { /* ... exact data from spec Section 8.6 ... */ };
// ... all other problems ...

export const CANVAS_DATA: Record<string, ProblemCanvasData> = {
  'design-youtube': YOUTUBE_DATA,
  'design-tinyurl': TINYURL_DATA,
  'design-twitter': TWITTER_DATA,
  'design-uber': UBER_DATA,
  'design-whatsapp': WHATSAPP_DATA,
  'design-rate-limiter': RATE_LIMITER_DATA,
  // ... all other slugs ...
};

export function getCanvasData(slug: string): ProblemCanvasData | null {
  return CANVAS_DATA[slug] ?? null;
}

export const CAMERA_REGIONS: CameraRegion[] = [
  { cx: 355,  cy: 300, fitW: 560,  fitH: 340,  maxS: 1    },
  { cx: 950,  cy: 280, fitW: 620,  fitH: 340,  maxS: 1    },
  { cx: 930,  cy: 460, fitW: 620,  fitH: 560,  maxS: 1    },
  { cx: 1540, cy: 370, fitW: 680,  fitH: 480,  maxS: 1    },
  { cx: 1480, cy: 700, fitW: 560,  fitH: 300,  maxS: 1    },
  { cx: 2385, cy: 460, fitW: 1090, fitH: 720,  maxS: 0.9  },
  { cx: 2385, cy: 560, fitW: 1090, fitH: 940,  maxS: 0.85 },
];

export const STAGE_META = [
  { label: 'Problem',                  budget: '3 min',  key: 'problem'  },
  { label: 'Functional requirements',  budget: '5 min',  key: 'fr'       },
  { label: 'Non-functional requirements', budget: '5 min', key: 'nfr'   },
  { label: 'Core entities',            budget: '5 min',  key: 'entities' },
  { label: 'API design',               budget: '5 min',  key: 'api'      },
  { label: 'High-level design',        budget: '15 min', key: 'hld'      },
  { label: 'Deep dives',               budget: '10 min', key: 'deep'     },
];
```

**Validation:** Run `tsc --noEmit` after creating these files. Zero errors before proceeding.

---

## Phase 2: Canvas Shell (Day 2)

**Goal:** The infinite canvas renders with dot grid, camera panning, tool strip, timer, breadcrumb, and bottom dock. No regions yet — just the structural chrome.

### 2.1 `useCamera` hook

File: `src/features/problem-flow-v2/hooks/useCamera.ts`

```typescript
export function useCamera(stage: number, vw: number, vh: number): string {
  const r = CAMERA_REGIONS[stage];
  const s = Math.min(r.maxS, (vw - 70) / r.fitW, (vh - 150) / r.fitH);
  const tx = Math.max(-60, r.cx - vw / (2 * s));
  const ty = Math.max(-40, r.cy - (vh - 30) / (2 * s));
  return `scale(${s}) translate(${-tx}px, ${-ty}px)`;
}
```

**Critical:** `vw` and `vh` must be measured from the canvas DOM element (the flex:1 area), NOT from `window.innerWidth`. The guide rail takes up 292px when open.

### 2.2 `useCanvasSession` hook

File: `src/features/problem-flow-v2/hooks/useCanvasSession.ts`

Manages `CanvasSessionState`. Key behaviors:
- `goTo(i)`: update stage and maxStage, set explainOpen if needed
- Timer tick via `setInterval`
- `vw`/`vh` via ResizeObserver on canvas element ref
- Keyboard listener for `←`, `→`, `Esc`
- Seniority stored in `localStorage('usd-seniority')`

```typescript
export function useCanvasSession(problemSlug: string) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CanvasSessionState>(initialState);
  
  // ... ResizeObserver for vw/vh
  // ... setInterval for timer
  // ... keydown listener
  // ... goTo function
  // ... feedback actions
  
  const cameraTransform = useCamera(state.stage, state.vw, state.vh);
  
  return { state, setState, canvasRef, cameraTransform, actions: { goTo, ... } };
}
```

### 2.3 `CanvasSessionUI.tsx` — Root Component

File: `src/features/problem-flow-v2/CanvasSessionUI.tsx`

```tsx
export default function CanvasSessionUI({ problem, ...props }: CanvasSessionUIProps) {
  const canvasData = getCanvasData(problem.slug);
  if (!canvasData) return <PracticeUI problem={problem} {...props} />;  // fallback
  
  const session = useCanvasSession(problem.slug);
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'row', background: '#0e0f12', fontFamily: "'Geist', system-ui, sans-serif", color: '#e8e9eb', overflow: 'hidden' }}>
      <CanvasArea session={session} canvasData={canvasData} />
      {session.state.railOpen && <GuideRail session={session} canvasData={canvasData} />}
    </div>
  );
}
```

### 2.4 `CanvasArea.tsx`

File: `src/features/problem-flow-v2/CanvasArea.tsx`

Structure:
```tsx
<div ref={session.canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
  {/* Infinite pannable canvas */}
  <div style={{
    position: 'absolute', left: 0, top: 0, width: 3200, height: 1700,
    transform: session.cameraTransform,
    transformOrigin: '0 0',
    transition: 'transform .7s cubic-bezier(.22,1,.36,1)',
    backgroundImage: 'radial-gradient(rgba(255,255,255,.055) 1px, transparent 1px)',
    backgroundSize: '24px 24px'
  }}>
    {/* Regions */}
    <ProblemCard canvasData={canvasData} session={session} />
    {session.state.maxStage >= 1 && <FRRegion canvasData={canvasData} session={session} />}
    {session.state.maxStage >= 2 && <NFRRegion canvasData={canvasData} session={session} />}
    {session.state.maxStage >= 3 && <EntitiesRegion canvasData={canvasData} session={session} />}
    {session.state.maxStage >= 4 && <APIRegion canvasData={canvasData} session={session} />}
    {session.state.maxStage >= 5 && <HLDRegion canvasData={canvasData} session={session} />}
    {session.state.maxStage >= 6 && <DeepDivesRegion canvasData={canvasData} session={session} />}
  </div>
  
  <TopBar session={session} problemTitle={canvasData.problem.title} />
  <BottomDock session={session} />
  {session.state.explainOpen && <StepExplainCard session={session} canvasData={canvasData} />}
</div>
```

**IMPORTANT:** Use CSS `visibility: hidden` or `opacity: 0` (not unmounting) for non-active regions when you need to hide them — to preserve user edits in `contenteditable` divs. But in V2 the design keeps all regions visible once revealed — they just fade in. No hiding needed.

### 2.5 `TopBar.tsx`, `BottomDock.tsx`

These are pure presentational components. Implement exactly as per spec Section 6.1 and 6.2. Both must be `position: absolute` inside `CanvasArea`.

**Test:** After Phase 2, you should see:
- Dark canvas with dot grid
- Breadcrumb top-left
- Tool strip top-center  
- Timer top-right
- Bottom dock with 7 ticks and nav arrows
- Stage label updates as you press ←→
- Camera smoothly pans between the 7 defined regions

---

## Phase 3: Guide Rail (Day 2–3)

**Goal:** Right panel renders with all three feedback states, seniority toggle, and timer.

### 3.1 `GuideRail.tsx`

File: `src/features/problem-flow-v2/GuideRail.tsx`

Implement exactly as per spec Section 6.3. Key items:
- Header: GUIDE label, stage title, "step N of 7", progress ticks
- Content: FOCUS ON tips, WORTH CONSIDERING suggestions
- Footer: feedback state machine (idle/loading/done), seniority cycler, timer

**Feedback state flow:**
```typescript
const handleReadCanvas = async () => {
  setState(s => ({ ...s, fb: 'loading' }));
  try {
    const notes = await fetchCanvasFeedback(stage, problemSlug, canvasContent);
    setState(s => ({ ...s, fb: 'done', fbNotes: notes }));
  } catch {
    // fallback to static feedback from canvasData
    const notes = canvasData.feedback[stage] ?? canvasData.feedback.def ?? DEFAULT_FEEDBACK;
    setState(s => ({ ...s, fb: 'done', fbNotes: notes }));
  }
};
```

**Test:** Guide rail shows correct tips and suggestions per stage. Feedback cycles through idle → shimmer → notes → dismiss.

---

## Phase 4: Canvas Regions (Day 3–5)

This is the bulk of the visual work. Implement one region at a time.

### 4.1 `ProblemCard.tsx`

Position: left=120, top=170, width=470  
Render: PROBLEM mono label, problem title (20px 600wt), context text, scope note  
Collapse behavior: toggle `problemCollapsed` in session state; when collapsed, show a chip in the guide rail header area

### 4.2 `FRRegion.tsx`

Position: left=690, top=150, width=520  
Render 4 cards in a 2×2 grid (exact positions per spec Section 5, Region 1)  
Cards 1-3: core requirements (from `fr.beginner/midLevel/senior` based on seniority)  
Card 4: out-of-scope (from `fr.outOfScope[0]`, dashed border, muted color)

**Editability:**
```tsx
<div
  contentEditable
  suppressContentEditableWarning
  onBlur={(e) => saveContent('fr', index, e.currentTarget.textContent ?? '')}
  style={{ fontFamily: "'Caveat', cursive", fontSize: 22, ... }}
>
  {session.state.canvasContent.fr[index] || defaultText}
</div>
```

**Animation:** Wrap the entire region in:
```tsx
<div style={{ animation: 'fadeIn .5s ease', position: 'absolute', ... }}>
```

### 4.3 `NFRRegion.tsx`

Position: left=690, top=420, width=470  
Render handwritten-style heading + bullet list  
Each bullet: text + optional annotation span (color: #8f95f2)  
Bullets come from `nfr.bullets` array  
List area is contenteditable (save on blur)

### 4.4 `EntitiesRegion.tsx`

Position: left=1250, top=150, width=580, height=420  
SVG overlay for relationship lines (exact coordinates from entity relationship data)  
Entity cards absolutely positioned per `entities.boxes[].position`  

```tsx
<div style={{ position: 'absolute', left: 1250, top: 150, width: 580, height: 420, animation: 'fadeIn .5s ease' }}>
  <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, ... }}>Core entities</div>
  <svg width="580" height="360" style={{ position: 'absolute', left: 0, top: 50, pointerEvents: 'none' }}>
    {canvasData.entities.relationships.map((rel, i) => (
      <line key={i} {...rel.line} stroke="#8a8d96" strokeWidth="1.5" />
    ))}
    {/* Cardinality labels */}
    {canvasData.entities.relationships.map((rel, i) => (
      <text key={i} /* position near midpoint of line */ style={{ fontFamily: 'Caveat', fontSize: 17, fill: '#8a8d96' }}>
        {rel.cardinality}
      </text>
    ))}
  </svg>
  {canvasData.entities.boxes.map((box, i) => (
    <EntityCard key={i} box={box} session={session} index={i} />
  ))}
</div>
```

**EntityCard** has:
- Position and rotation from data
- Border color: `#8f95f2` if `highlighted`, else `#c9ccd4`
- Title (Caveat 22px 600wt) with border-bottom
- Fields list (Caveat 18px #b3b6bf)
- Double-click to edit

### 4.5 `APIRegion.tsx`

Position: left=1250, top=600, width=460  
One code block card with all endpoints  
Endpoint rendering:
```tsx
{endpoint.method} {endpoint.path} {endpoint.comment}
// Method colored: #8f95f2
// Path: #cdd1da
// Comment: #5f636c
```

Code block is one contenteditable div (not per-endpoint).

### 4.6 `HLDRegion.tsx`

Position: left=1870, top=120, width=1030, height=640  
This is the most complex region. Render:

1. Section heading
2. SVG with arrow defs (`marker#arr`) and all connector lines
3. Component boxes (absolutely positioned, slight rotations)
4. Arrow flow labels (absolutely positioned text)

```tsx
<svg width="1030" height="600" viewBox="0 0 1030 600" style={{ position: 'absolute', left: 0, top: 40, pointerEvents: 'none' }}>
  <defs>
    <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L8,4 L0,8" fill="none" stroke="#8a8d96" strokeWidth="1.4" />
    </marker>
  </defs>
  {canvasData.hld.arrows.map((arrow, i) => (
    <line
      key={i}
      x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2}
      stroke="#8a8d96" strokeWidth="1.5"
      strokeDasharray={arrow.dashed ? "6 5" : undefined}
      markerEnd="url(#arr)"
      markerStart={arrow.bidir ? "url(#arr)" : undefined}
    />
  ))}
</svg>
{canvasData.hld.components.map((comp, i) => (
  <HLDComponentBox key={i} comp={comp} />
))}
{canvasData.hld.arrows.filter(a => a.label).map((arrow, i) => (
  <div key={i} style={{ position: 'absolute', ...arrow.label!.position, fontFamily: 'Caveat', fontSize: 17, color: '#8a8d96', transform: `rotate(${arrow.label!.rotation ?? 0}deg)` }}>
    {arrow.label!.text}
  </div>
))}
```

### 4.7 `DeepDivesRegion.tsx`

Renders on top of/adjacent to HLD region. Two parts:

**Annotation circles** (on HLD component positions):
```tsx
{canvasData.deepDives.circles.map((circle, i) => (
  <>
    <div style={{
      position: 'absolute',
      ...circle.position,
      border: '1.8px dashed #d99a9a',
      borderRadius: '50%',
      transform: `rotate(${circle.rotation ?? 0}deg)`
    }} />
    <div style={{
      position: 'absolute',
      ...circle.label.position,
      fontFamily: 'Caveat', fontSize: 20, color: '#d99a9a',
      transform: `rotate(${circle.label.rotation ?? 0}deg)`
    }}>
      {circle.label.text}
    </div>
  </>
))}
```

**Deep dives list** (position: left=1890, top=830, width=620):
```tsx
<div style={{ position: 'absolute', left: 1890, top: 830, width: 620 }}>
  <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, ... }}>Deep dives</div>
  <div style={{ marginTop: 12, fontFamily: 'Caveat', fontSize: 21, lineHeight: 1.8, color: '#dfe1e8' }}>
    {canvasData.deepDives.items.map((item, i) => (
      <div key={i} contentEditable suppressContentEditableWarning onBlur={...}>
        <span style={{ color: '#d99a9a' }}>{['①','②','③'][i]}</span> {item.text}
      </div>
    ))}
  </div>
</div>
```

---

## Phase 5: AI Integration and Persistence (Day 5–6)

### 5.1 Canvas Feedback API

File: `src/app/api/ai/canvas-feedback/route.ts`

```typescript
POST /api/ai/canvas-feedback
Body: { problemSlug: string, stage: number, canvasContent: CanvasContent }
Response: { notes: FeedbackNote[] }
```

Prompt template:
```
You are evaluating a system design candidate's work on stage {stage} ({stageLabel}) 
of the "{problemTitle}" problem.

Here is what they wrote:
{serializedCanvasContent}

Return exactly 3 feedback items as JSON: [{ "tag": "✓"|"△"|"○", "text": "..." }]
- ✓: something they did well (specific, not generic praise)
- △: something worth considering but not wrong  
- ○: something missing that matters at this stage

Keep each text under 80 characters. Be direct and technical.
```

### 5.2 Canvas Progress Persistence

File: `src/app/api/practice/canvas-progress/route.ts`

```typescript
POST /api/practice/canvas-progress
Body: { problemSlug: string, stage: number, canvasContent: CanvasContent }
```

Extend `ProblemProgress` model:
```prisma
model ProblemProgress {
  // ... existing fields ...
  canvasSnapshot   Json?  // CanvasContent JSON
  canvasStage      Int?   // maxStage reached
}
```

### 5.3 `useCanvasContent` hook

File: `src/features/problem-flow-v2/hooks/useCanvasContent.ts`

```typescript
export function useCanvasContent(problemSlug: string, canvasData: ProblemCanvasData) {
  const [content, setContent] = useState<CanvasContent>(() => {
    // Initialize from canvasData defaults
    return {
      fr: canvasData.fr.midLevel.slice(0, 3).concat(canvasData.fr.outOfScope[0]),
      nfr: canvasData.nfr.bullets.map(b => b.annotation ? `${b.text} ${b.annotation}` : b.text),
      entities: canvasData.entities.boxes.map(b => ({ name: b.name, fields: b.fields })),
      api: canvasData.api.endpoints.map(e => `${e.method} ${e.path}${e.comment ? ' ' + e.comment : ''}`).join('\n'),
      hldNotes: '',
      deepDiveNotes: canvasData.deepDives.items.map(i => i.text),
    };
  });
  
  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`usd-canvas-${problemSlug}`);
    if (saved) setContent(JSON.parse(saved));
  }, [problemSlug]);
  
  // Debounced save to localStorage
  const updateContent = useDebouncedCallback((key: keyof CanvasContent, value: any) => {
    setContent(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(`usd-canvas-${problemSlug}`, JSON.stringify(next));
      return next;
    });
  }, 500);
  
  return { content, updateContent };
}
```

---

## Phase 6: Feature Flag + Polish (Day 6–7)

### 6.1 Wire up feature flag in practice page

In `src/app/practice/[slug]/page.tsx`, add after existing feature checks:

```typescript
const v2Enabled = await canAccessFeature(session.user.id, 'problemFlowV2');

if (v2Enabled) {
  const { CanvasSessionUI } = await import('@/features/problem-flow-v2');
  return (
    <CanvasSessionUI
      problem={problem}
      existingProgress={progressForUI}
      interviewAllowed={interviewAllowed}
      probeEnabled={probeAllowed}
      voiceEnabled={voiceEnabled}
    />
  );
}

return <PracticeUI ... />;  // existing v1 unchanged
```

### 6.2 Add feature flag to admin panel

In `src/lib/feature-flags.ts`, add `'problemFlowV2'` to the feature flag list.

### 6.3 Step Explanation Card

File: `src/features/problem-flow-v2/StepExplainCard.tsx`

Implement exactly per spec Section 6.4.  
Special behavior for stage 1: seniority picker renders inside the card.  
ESC key dismisses (keydown listener in `useCanvasSession`).

### 6.4 Mobile fallback

In `CanvasSessionUI.tsx`:
```typescript
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  setIsMobile(window.innerWidth < 768);
  const handler = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);

if (isMobile) return <PracticeUI problem={problem} {...props} />;
```

### 6.5 Font loading

In `src/app/layout.tsx`, add Caveat font:
```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Caveat:wght@500;600&display=swap" rel="stylesheet" />
```

(Check if Geist is already loaded — it likely is. Only add Caveat if missing.)

---

## Testing Checklist

### Phase 1 Tests
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `getCanvasData('design-youtube')` returns correct data
- [ ] All 40+ slugs return non-null from `getCanvasData`

### Phase 2 Tests
- [ ] Canvas renders with dot grid
- [ ] Camera pans to each of 7 regions with ←→ keys
- [ ] Camera transition is smooth (0.7s cubic-bezier)
- [ ] Bottom dock ticks reflect current stage
- [ ] Timer increments and pauses on click
- [ ] Guide chip appears when rail collapsed

### Phase 3 Tests
- [ ] Guide rail shows correct tips per stage
- [ ] Suggestions change when seniority toggled
- [ ] Feedback cycles: idle → shimmer (1.4s) → notes → dismiss
- [ ] Seniority persists across page reloads

### Phase 4 Tests
- [ ] All 7 regions render correctly for `design-youtube`
- [ ] Regions fade in when first revealed (maxStage advance)
- [ ] Entity cards have correct positions, rotations, border colors
- [ ] HLD SVG arrows have arrowheads and correct dashed/solid styles
- [ ] Deep dive circles are dashed red (#d99a9a)
- [ ] All editable areas save on blur
- [ ] Content persists across stage navigation (no unmount)

### Phase 5 Tests
- [ ] "Read my canvas" hits correct API endpoint
- [ ] AI feedback renders in < 3s
- [ ] Canvas content persists to localStorage on edit
- [ ] canvasSnapshot saved to DB on stage advance
- [ ] Restoring from localStorage works on page reload

### Phase 6 Tests
- [ ] `problemFlowV2` flag off → V1 renders
- [ ] `problemFlowV2` flag on → V2 renders
- [ ] Mobile (<768px) → V1 renders even with flag on
- [ ] ESC closes explain card
- [ ] Stage 1 explain card shows seniority picker

---

## Common Mistakes to Avoid

1. **DO NOT** measure `vw` from `window.innerWidth` — measure from the canvas element ref
2. **DO NOT** unmount regions when navigating stages — use CSS visibility
3. **DO NOT** apply the camera transform to individual regions — apply it to the 3200×1700 wrapper div
4. **DO NOT** import V2 components in V1 code — the feature flag import is the only connection
5. **DO NOT** hardcode stage content as generic text — every problem must have its own `ProblemCanvasData` 
6. **DO NOT** use `transformOrigin: 'center center'` — use `transformOrigin: '0 0'` for the canvas transform
7. **DO NOT** add new npm packages without checking if equivalent exists (e.g., use native `ResizeObserver` not a package)
