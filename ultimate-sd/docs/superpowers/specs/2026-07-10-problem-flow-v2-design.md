# Problem Flow V2 — Master Design Specification
**Version:** 2.0  
**Date:** 2026-07-10  
**Status:** Authoritative — all implementation must match this document exactly  
**Author:** Derived from canvas prototype in `# Ultimate SD Canvas Redesign/Canvas Session.dc.html`

---

## 0. Why This Spec Exists

Previous spec and plan were too abstract and did not match the canvas design. Implementation fell back to the old form-based step-by-step flow. This document is pixel-level, interaction-level, and data-level exact so that any developer reading it produces the same output as the canvas prototype.

**V2 is an upgrade, not a replacement.** The existing platform's auth, progress tracking, problem library, AI evaluation, session persistence, timer, and interview modes all stay. V2 replaces only the practice canvas UI and the per-stage data model.

---

## 1. Overview

V2 transforms the practice page from a form-based wizard into an **infinite canvas whiteboard session**. The experience mimics a real interview on a physical whiteboard:

- One continuous pannable surface holds everything the user writes
- The camera pans to center on the active stage's region
- Content accumulates — earlier work stays visible in the periphery
- The guide rail offers focused tips and AI canvas-reading per stage
- Seven ordered stages replace the old phase+substep model

**URL:** `/practice/[slug]` — same route, feature-flagged behind `problemFlowV2`

---

## 2. Layout Architecture

```
┌─────────────────────────────────────────────────────────┬──────────────┐
│  CANVAS AREA (flex: 1, overflow: hidden)                │  GUIDE RAIL  │
│                                                         │  width: 292px│
│  [top bar: breadcrumb | tool strip | timer]             │  flex: none  │
│                                                         │              │
│  [infinite pannable canvas 3200×1700px]                 │  [GUIDE mono]│
│    dot grid background                                  │  stage title │
│    progressive regions revealed by stage                │  step X of 7 │
│                                                         │  prog ticks  │
│                                                         │              │
│                                                         │  FOCUS ON    │
│                                                         │  – tip 1     │
│                                                         │  – tip 2     │
│                                                         │  – tip 3     │
│  [step explain modal — centered overlay]                │              │
│                                                         │  WORTH       │
│  [bottom dock: ‹ ticks › | stage label · budget · N/7]  │  CONSIDERING │
│                                                         │  suggestion  │
└─────────────────────────────────────────────────────────┤              │
                                                          │  [Read my    │
                                                          │   canvas]    │
                                                          │              │
                                                          │  seniority↻  │
                                                          │  timer       │
                                                          └──────────────┘
```

---

## 3. Visual Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0e0f12` | Page background |
| `--canvas-bg` | `#0e0f12` | Canvas surface |
| `--canvas-dot` | `radial-gradient(rgba(255,255,255,.055) 1px, transparent 1px)` | Dot grid, 24px size |
| `--rail-bg` | `#121318` | Guide rail background |
| `--card-bg` | `#15161c` | Content cards |
| `--card-border` | `rgba(255,255,255,.09)` | Card borders |
| `--overlay-bg` | `#17181f` | Modal/explain overlay |
| `--text-primary` | `#e8e9eb` | Primary text |
| `--text-secondary` | `#b3b6bf` | Secondary text |
| `--text-muted` | `#9a9da6` | Muted text |
| `--text-faint` | `#8a8d96` | Faint labels |
| `--text-ghost` | `#6b6e77` | Ghost text |
| `--text-dim` | `#5f636c` | Dim/disabled |
| `--accent` | `#8f95f2` | Primary accent (periwinkle) |
| `--accent-light` | `#c3c6f7` | Light accent |
| `--accent-bg` | `rgba(143,149,242,.12)` | Accent bg fill |
| `--accent-border` | `rgba(143,149,242,.5)` | Accent border |
| `--ok` | `#8fc7a6` | Feedback: good (✓) |
| `--warn` | `#d9c08a` | Feedback: consider (△) |
| `--crit` | `#d99a9a` | Feedback: missing (○) / deep dive circles |
| `--divider` | `rgba(255,255,255,.07)` | Divider lines |
| `--divider-light` | `rgba(255,255,255,.06)` | Lighter dividers |
| `--tick-active` | `#8f95f2` | Active stage tick |
| `--tick-visited` | `rgba(255,255,255,.32)` | Visited stage tick |
| `--tick-future` | `rgba(255,255,255,.1)` | Future stage tick |

**Typography:**
- Body: `Geist`, system-ui, sans-serif
- Handwriting: `Caveat`, 500-600 weight (all user content on canvas)
- Monospace: `Geist Mono` (code blocks, labels like "GUIDE", "PROBLEM", "FOCUS ON")

**Animations:**
- `fadeUp`: from `opacity:0;translateY(10px)` to `opacity:1;translateY(0)`, 0.35s cubic-bezier(.22,1,.36,1)
- `fadeIn`: from `opacity:0` to `opacity:1`, 0.5s ease
- `shimmer`: opacity cycles 0.35→0.7→0.35, 1.2s infinite (loading skeletons)
- Camera: `transform: scale(s) translate(-tx, -ty)`, `transition: transform .7s cubic-bezier(.22,1,.36,1)`

---

## 4. Stage System

### 4.1 Stage Definitions (universal across all problems)

| # | Label | Budget | Stage Key |
|---|---|---|---|
| 0 | Problem | 3 min | `problem` |
| 1 | Functional requirements | 5 min | `fr` |
| 2 | Non-functional requirements | 5 min | `nfr` |
| 3 | Core entities | 5 min | `entities` |
| 4 | API design | 5 min | `api` |
| 5 | High-level design | 15 min | `hld` |
| 6 | Deep dives | 10 min | `deep` |

**Total interview budget: ~48 min**

### 4.2 Stage Navigation Rules

- `maxStage` tracks the furthest stage reached (persisted in session)
- All regions up to `maxStage` are visible on canvas simultaneously (accumulated, not replaced)
- Stage 0 is never blocked — always accessible
- Advancing past stage 0 triggers the step explanation card (unless already understood)
- Arrow keys `←` / `→` navigate stages
- Bottom dock ticks are clickable to jump to any visited stage
- Clicking a future (unvisited) tick does nothing

### 4.3 Camera Transform

For each stage, a camera region is defined:
```typescript
type CameraRegion = {
  cx: number;   // center x in canvas coords
  cy: number;   // center y in canvas coords
  fitW: number; // desired visible width
  fitH: number; // desired visible height
  maxS: number; // maximum scale (1.0 = no zoom in)
};
```

Camera transform calculation:
```typescript
const vw = canvasElWidth;   // measured, not assumed
const vh = canvasElHeight;  // measured, not assumed
const r = regions[stage];
const s = Math.min(r.maxS, (vw - 70) / r.fitW, (vh - 150) / r.fitH);
const tx = Math.max(-60, r.cx - vw / (2 * s));
const ty = Math.max(-40, r.cy - (vh - 30) / (2 * s));
// Applied as: transform: scale(s) translate(-tx px, -ty px)
```

**Camera regions (canvas coords, universal):**
```typescript
const CAMERA_REGIONS: CameraRegion[] = [
  { cx: 355,  cy: 300, fitW: 560,  fitH: 340,  maxS: 1    }, // stage 0: problem
  { cx: 950,  cy: 280, fitW: 620,  fitH: 340,  maxS: 1    }, // stage 1: FR
  { cx: 930,  cy: 460, fitW: 620,  fitH: 560,  maxS: 1    }, // stage 2: NFR
  { cx: 1540, cy: 370, fitW: 680,  fitH: 480,  maxS: 1    }, // stage 3: entities
  { cx: 1480, cy: 700, fitW: 560,  fitH: 300,  maxS: 1    }, // stage 4: API
  { cx: 2385, cy: 460, fitW: 1090, fitH: 720,  maxS: 0.9  }, // stage 5: HLD
  { cx: 2385, cy: 560, fitW: 1090, fitH: 940,  maxS: 0.85 }, // stage 6: deep dives
];
```

---

## 5. Canvas Regions

The canvas is 3200×1700px (virtual). All regions are absolutely positioned within it.

### Region 0 — Problem Card (always visible)
- **Position:** left=120px, top=170px, width=470px
- **Background:** `#15161c`
- **Border:** `1px solid rgba(255,255,255,.09)`, radius=12px
- **Shadow:** `0 16px 40px rgba(0,0,0,.4)`
- **Padding:** 22px 24px 20px

**Content layout:**
```
[PROBLEM mono label]          [collapse ▾]
[Problem Title  20px 600wt]
[Problem context text  14px  #b3b6bf  line-height:1.65]
[Footer: "Collapses into the guide rail once read."  11.5px  #5f636c]
```

**Collapsed state:** Card becomes a chip in the guide rail header. The "collapse ▾" / "expand ▴" toggle is clickable.

---

### Region 1 — Functional Requirements (visible from stage 1+)
- **Position:** left=690px, top=150px, width=520px
- **Appearance:** Animated `fadeIn .5s ease` when first revealed

**Layout:**
```
[Caveat 26px 600wt "Functional requirements"  underline: 2px dashed rgba(255,255,255,.18)  rotate(-.5deg)]

Sticky note cards laid out in a 2-column grid:
  Card 1: left=6px,   top=58px,  width=210px  border:#c9ccd4  rotate(-.7deg)
  Card 2: left=250px, top=66px,  width=230px  border:#c9ccd4  rotate(.6deg)
  Card 3: left=6px,   top=132px, width=220px  border:#c9ccd4  rotate(.4deg)
  Card 4: left=250px, top=142px, width=230px  border:1.6px dashed #8a8d96  color:#9a9da6  rotate(-.4deg)  [out-of-scope / later]
```

Each card:
- Border: 1.6px solid #c9ccd4 (or dashed for out-of-scope)
- Border-radius: irregular e.g. `6px 9px 7px 8px` (each card slightly different)
- Padding: 10px 14px
- Font: Caveat, 22px, #e8e9eb

**User interaction:** Each card is editable. Clicking the card area turns it into a contenteditable div while maintaining the Caveat styling.

**Per-problem FR data:** See Section 8.

---

### Region 2 — Non-Functional Requirements (visible from stage 2+)
- **Position:** left=690px, top=420px, width=470px
- **Appearance:** fadeIn .5s ease

**Layout:**
```
[Caveat 26px 600wt "Non-functional"  underline dashed  rotate(.3deg)]

Handwritten list (margin-top: 14px):
  font: Caveat 22px  line-height:1.75  #dfe1e8  rotate(-.3deg)
  • [NFR item 1 with accent annotation in #8f95f2]
  • [NFR item 2]
  • [NFR item 3]
  • [NFR item 4 with accent annotation]
```

**User interaction:** The list area is a contenteditable div. Each bullet can be edited.

**Per-problem NFR data:** See Section 8.

---

### Region 3 — Core Entities (visible from stage 3+)
- **Position:** left=1250px, top=150px, width=580px, height=420px
- **Appearance:** fadeIn .5s ease

**Layout:**
```
[Caveat 26px 600wt "Core entities"  underline dashed]

SVG overlay (580×360px, absolute left=0 top=50px):
  relationship lines between entity boxes (stroke: #8a8d96, width: 1.5px)
  cardinality labels (Caveat 17px #8a8d96, rotated ±4deg)

Entity cards (absolute positioned, each with unique rotation):
  Card style: border 1.6px solid #c9ccd4 (primary) or #8f95f2 (highlighted)
  Padding: 8px 12px 10px
  Title: Caveat 22px 600wt #e8e9eb  border-bottom: 1.4px solid rgba(255,255,255,.2)  pb-3px
  Fields: Caveat 18px #b3b6bf  line-height:1.5  mt-5px
```

**Entity card positions (for 3 entities):**
- Card 1: left=10px, top=100px, width=150px, rotate(-.5deg)
- Card 2: left=230px, top=140px, width=170px, rotate(.4deg), border: #8f95f2 (central/primary entity highlighted)
- Card 3: left=420px, top=230px, width=140px, rotate(-.6deg)

**SVG relationship lines:** 2 lines connecting entity boxes, drawn from center-bottom of one to center-top of another.

**Per-problem entity data:** See Section 8.

---

### Region 4 — API Design (visible from stage 4+)
- **Position:** left=1250px, top=600px, width=460px
- **Appearance:** fadeIn .5s ease

**Layout:**
```
[Caveat 26px 600wt "API"  underline dashed]

Code block card (margin-top: 12px):
  border: 1.6px solid #c9ccd4
  border-radius: irregular
  padding: 14px 18px
  font: Geist Mono 13.5px  line-height:2  color:#cdd1da
  rotate(-.25deg)
  
  Method words colored: #8f95f2 (POST, GET, PUT, DELETE)
  Comments colored: #5f636c
```

**User interaction:** The code block is editable. Clicking allows editing endpoint definitions.

**Per-problem API data:** See Section 8.

---

### Region 5 — High-Level Design (visible from stage 5+)
- **Position:** left=1870px, top=120px, width=1030px, height=640px
- **Appearance:** fadeIn .5s ease

**Layout:**
```
[Caveat 26px 600wt "High-level design"  underline dashed]

SVG (1030×600px, absolute left=0 top=40px):
  Arrow definitions (marker: #arr)
  Connector lines: stroke #8a8d96, width 1.5px, with markers
  Dashed lines for async paths: stroke-dasharray: "6 5"

Component boxes (absolute positioned):
  Style: border 1.6px solid #c9ccd4 (standard) or #8f95f2 (key component)
  Padding: 12px  text-align: center
  Font: Caveat 21px #e8e9eb
  Subtitle: Caveat 16px #9a9da6 (for storage type etc.)
  Each box has a unique border-radius and slight rotation (±0.3-0.6deg)

Flow labels (absolute positioned):
  Font: Caveat 17px #8a8d96
  Slight rotation (±2deg)
```

**SVG arrow marker definition:**
```svg
<marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
  <path d="M0,0 L8,4 L0,8" fill="none" stroke="#8a8d96" stroke-width="1.4"/>
</marker>
```

**Per-problem HLD data:** See Section 8.

---

### Region 6 — Deep Dives (visible from stage 6+)
- **Position:** Overlapping with HLD region (same x-band: ~1890-2650px), starting at top=820px
- **Appearance:** fadeIn .5s ease

**Layout:**
```
Annotation circles on the HLD diagram:
  position: absolute on specific HLD components
  border: 1.8px dashed #d99a9a  border-radius:50%
  slight rotation (±1deg)
  Label arrows: Caveat 20px #d99a9a  rotate(±1.5deg)

Deep dives list (below the circles):
  position: absolute  left=1890px  top=830px  width=620px
  
  [Caveat 26px 600wt "Deep dives"  underline dashed]
  
  List (margin-top: 12px):
    font: Caveat 21px  line-height:1.8  #dfe1e8
    ① red number  followed by problem-specific deep dive text
    ② ...
    ③ ...
```

**Per-problem deep dive data:** See Section 8.

---

## 6. Chrome Elements

### 6.1 Top Bar

**Breadcrumb (top-left):**
```
position: absolute  left=20px  top=14px  z-index=5
background: rgba(22,23,29,.92)
border: 1px solid rgba(255,255,255,.07)
border-radius: 9px
padding: 7px 14px
box-shadow: 0 6px 20px rgba(0,0,0,.3)
font-size: 12.5px  color: #8a8d96

Content: ← [Problem Title] / [Stage Label]
← : cursor pointer, color #5f636c, hover #e8e9eb
```

**Tool Strip (top-center):**
```
position: absolute  left=50%  top=14px  transform=translateX(-50%)  z-index=5
background: #16171d
border: 1px solid rgba(255,255,255,.07)
border-radius: 9px
padding: 4px
display: flex  gap: 2px

Tools: Select(▲) Rectangle(▢) Ellipse(◯) Arrow(→) Text(A) Draw(✎)
Each: width=30px height=28px  border-radius=6px  font-size=13px  cursor=pointer
Active: background rgba(143,149,242,.16)  color #c3c6f7
Inactive: color #9a9da6  hover: background rgba(255,255,255,.06)
```

**Timer (top-right, default variant: corner):**
```
position: absolute  right=20px  top=14px  z-index=5
font: Geist Mono 12px  color: #6b6e77
cursor: pointer (click to toggle pause)
background: rgba(22,23,29,.92)
border: 1px solid rgba(255,255,255,.07)
border-radius: 9px
padding: 7px 12px

Display: "MM:SS" or "⏸ MM:SS" when paused
hover: color #c9ccd4
```

Three timer variants: `corner` (always visible), `hover` (shows · until hover), `rail` (only in guide rail footer). Default: `corner`.

**"Guide" chip (when rail is collapsed):**
```
position: absolute  right=20px  top=52px  z-index=5
background: #16171d
border: 1px solid rgba(255,255,255,.09)
border-radius: 8px
color: #9a9da6  font-size: 11.5px
padding: 6px 12px
display: flex  gap: 7px

Contains: [●  6px circle  bg: #8f95f2]  Guide
hover: color #e8e9eb  border-color rgba(255,255,255,.18)
```

---

### 6.2 Bottom Dock

```
position: absolute  left=50%  bottom=18px  transform=translateX(-50%)  z-index=5
display: flex  flex-direction: column  align-items: center  gap: 7px

Navigation pill:
  background: #16171d
  border: 1px solid rgba(255,255,255,.07)
  border-radius: 10px
  padding: 4px 10px
  box-shadow: 0 6px 20px rgba(0,0,0,.3)
  display: flex  align-items: center  gap: 4px

  ‹ button: color #6b6e77  hover #e8e9eb  14px  padding: 4px 6px
  
  Stage ticks (one per stage):
    width: active=26px else=14px  height=4px  border-radius=2px
    bg: active=#8f95f2  visited=rgba(255,255,255,.32)  future=rgba(255,255,255,.1)
    transition: all .35s
    
  › button: same as ‹

Label row (below pill):
  font-size: 11px  color: #6b6e77
  Format: "{stage.label} · ≈{stage.budget} · {stageNum}/7    ←→ to move"
  "←→ to move" colored #3c3f47
```

---

### 6.3 Guide Rail (292px wide)

**Header section (padding: 18px 20px 14px, border-bottom: rgba(255,255,255,.06)):**
```
[GUIDE  mono 10.5px #6b6e77]         [⌄ collapse button]
[Stage Label  16px 600wt]
[step N of 7 · ideal ≈Budget  12px #8a8d96]

Progress ticks (7 ticks, height=3px):
  flex: 1 each  height=3px  border-radius=2px
  bg: same color rules as bottom dock ticks
  margin-top: 12px  gap: 3px
```

**Content section (flex: 1, overflow-y: auto, padding: 16px 20px):**
```
FOCUS ON  (mono 10px #6b6e77  letter-spacing .14em  mb: 10px)
Tips (gap: 9px, mb: 22px):
  – {tip text}  (font-size: 12.5px  line-height: 1.55  color: #b3b6bf)
  dash: color #4a4d56  flex: none

WORTH CONSIDERING  (mono 10px #6b6e77  mb: 10px)
Suggestions (gap: 8px):
  {suggestion text}
  (font-size: 12.5px  border: 1px dashed rgba(255,255,255,.09)  border-radius: 7px  padding: 7px 10px  color: #8a8d96)
  
Footer: "Reference only — the canvas is yours. Add, adapt or ignore."
(font-size: 11px  color: #5f636c  line-height: 1.5)
```

**Footer section (padding: 14px 20px 16px, border-top: rgba(255,255,255,.06)):**

Three feedback states:

*Idle:*
```
[Read my canvas  button]
  width: 100%  background: transparent
  border: 1px solid rgba(255,255,255,.11)
  border-radius: 8px  color: #9a9da6  font-size: 12.5px  padding: 9px 0
  hover: color #e8e9eb  border-color rgba(143,149,242,.5)
```

*Loading (shimmer):*
```
Two skeleton lines (height=9px, border-radius=4px, bg=rgba(255,255,255,.08), shimmer animation):
  Line 1: full width, delay 0
  Line 2: width 70%, delay 0.15s
"reading your canvas…"  font-size: 11px  color: #5f636c  mt: 2px
```

*Done (feedback notes):*
```
Feedback items (gap: 9px, fadeUp animation):
  [tag]  [text]
  tag colors: ✓ = #8fc7a6  △ = #d9c08a  ○ = #d99a9a
  text: 12px  color: #b3b6bf  line-height: 1.55

"dismiss" link: color #5f636c  hover #9a9da6  11px
```

**Rail footer bottom row:**
```
[{seniority} ↻  button]  (bg rgba(255,255,255,.05)  border rgba(255,255,255,.08)  radius 20px  color #9a9da6  11px  padding 4px 11px)
[{clock}  Geist Mono 11.5px  color #6b6e77  cursor pointer  hover #c9ccd4]  (if timer variant = rail)
```

**Seniority options:** `['Beginner', 'Mid-level', 'Senior']`  
Default: `'Mid-level'`  
Affects: Stage 1 (FR) suggestions (different suggestions per seniority level)

---

### 6.4 Step Explanation Card (modal overlay)

Triggered when: entering a new (not yet "understood") stage with `autoExplain=true`.  
Dismissed by: clicking "Got it — start sketching" or pressing Escape.

```
Overlay: position absolute  inset 0  display flex  align-items center  justify-content center
  z-index: 10  pointer-events: none

Card: width=430px  background=#17181f  border=1px solid rgba(255,255,255,.1)
  border-radius: 14px  padding: 24px 26px 22px
  box-shadow: 0 24px 70px rgba(0,0,0,.55)
  pointer-events: auto  animation: fadeUp .35s cubic-bezier(.22,1,.36,1)

Content:
  [STEP N OF 7 · ≈Budget  mono 10.5px #8f95f2  mb: 9px]
  [Stage Label  19px 600wt  ls: -.01em  mb: 8px]
  [stage.explain  13.5px  line-height: 1.65  color: #b3b6bf]

  [Seniority picker — only on stage 1:]
    padding-top: 14px  border-top: 1px solid rgba(255,255,255,.07)  mt: 16px
    "How deep should I calibrate suggestions?"  12px #8a8d96  mb: 9px
    3 buttons: flex, gap 8px, each flex:1, padding 8px 0, radius 8px
    Active: border rgba(143,149,242,.7)  bg rgba(143,149,242,.12)  color #c3c6f7
    Inactive: border rgba(255,255,255,.1)  bg transparent  color #9a9da6

  Footer: display flex  align-items center  justify-content space-between  mt: 18px
    [Got it — start sketching  button  bg #e8e9eb  color #111217  radius 8px  px 16px  py 9px  13px 500wt  hover bg #ffffff]
    [esc  11px  color #5f636c]
```

---

## 7. State Model

```typescript
interface CanvasSessionState {
  // Navigation
  stage: number;           // 0–6, current stage
  maxStage: number;        // furthest stage reached
  
  // Explanation modal
  explainOpen: boolean;
  understood: Record<number, boolean>;  // stages the user dismissed
  
  // Feedback
  fb: 'idle' | 'loading' | 'done';
  
  // Timer
  seconds: number;
  paused: boolean;
  timerShown: boolean;     // for hover variant
  
  // UI
  railOpen: boolean;
  seniority: 'Beginner' | 'Mid-level' | 'Senior' | null;
  
  // Canvas measurements
  vw: number;
  vh: number;
  
  // Problem card
  problemCollapsed: boolean;
  
  // Canvas content (what the user wrote per region)
  // Persisted to session storage / server
  canvasContent: {
    fr: string[];          // list of FR items (editable cards)
    nfr: string[];         // list of NFR items
    entities: EntityContent[];  // entity boxes with user edits
    api: string;           // raw text of API block
    hld: string;           // free-form notes on HLD
    deepDives: string[];   // per-deep-dive notes
  };
}

interface EntityContent {
  name: string;
  fields: string[];
  highlighted: boolean;
}
```

---

## 8. Per-Problem Stage Data

Each problem defines the following data structure:

```typescript
interface ProblemCanvasData {
  // Stage 0
  problem: {
    title: string;
    context: string;  // 2-3 sentence description with key numbers
    scopeNote: string;  // what's in/out of scope for this session
  };
  
  // Stage 1 — FR
  fr: {
    beginner: string[];    // 3-4 items
    midLevel: string[];    // 3-4 items (different framing)
    senior: string[];      // 4-5 items (more nuanced, includes stretch)
    outOfScope: string[];  // 1-2 items to park
  };
  
  // Stage 2 — NFR
  nfr: {
    bullets: Array<{
      text: string;
      annotation?: string;  // the purple #8f95f2 note appended
    }>;
  };
  
  // Stage 3 — Entities
  entities: {
    boxes: Array<{
      name: string;
      fields: string[];
      highlighted: boolean;  // true = #8f95f2 border
      position: { left: number; top: number; width: number };
      rotation: number;  // degrees
    }>;
    relationships: Array<{
      from: string;    // entity name
      to: string;
      cardinality: string;  // e.g. "1 : N"
      line: { x1: number; y1: number; x2: number; y2: number };
    }>;
  };
  
  // Stage 4 — API
  api: {
    endpoints: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      path: string;
      comment?: string;
    }>;
  };
  
  // Stage 5 — HLD
  hld: {
    components: Array<{
      name: string;
      subtitle?: string;
      position: { left: number; top: number; width: number };
      rotation: number;
      highlighted: boolean;  // #8f95f2 border
    }>;
    arrows: Array<{
      x1: number; y1: number; x2: number; y2: number;
      dashed?: boolean;
      bidir?: boolean;
      label?: { text: string; position: { left: number; top: number }; rotation?: number };
    }>;
  };
  
  // Stage 6 — Deep Dives
  deepDives: {
    circles: Array<{
      position: { left: number; top: number; width: number; height: number };
      label: { text: string; position: { left: number; top: number }; rotation?: number };
      rotation?: number;
    }>;
    items: Array<{
      text: string;    // the dive description + solution hint
    }>;
  };
  
  // Guide rail data per stage
  guide: {
    [stage: number]: {
      tips: string[];
      suggestions: string[] | null;
      frSuggestions?: { beginner: string[]; midLevel: string[]; senior: string[] };  // stage 1 only
    };
  };
  
  // AI feedback per stage (default until live AI reads)
  feedback: {
    [stage: number]: Array<{
      tag: '✓' | '△' | '○';
      text: string;
    }>;
  };
}
```

---

### 8.1 Design YouTube

```typescript
{
  problem: {
    title: "Design YouTube",
    context: "A video platform where creators upload videos and viewers watch, search, and comment. Assume ~1B daily watches and 500 hours of video uploaded every minute. Focus on the upload→watch path.",
    scopeNote: "In scope: upload, transcoding, streaming, search. Out of scope: monetization, recommendations ML, live streaming for now."
  },
  fr: {
    beginner: ["Upload a video", "Watch / stream a video", "Search by title"],
    midLevel: ["Upload → process → watch", "Search and discovery", "Like / comment"],
    senior: ["Upload → transcode → adaptive playback", "Feed and search", "Engagement: views, likes, comments", "Resumable uploads (stretch)"],
    outOfScope: ["later: likes + comments", "recommendations ML"]
  },
  nfr: {
    bullets: [
      { text: "~1B DAU — read heavy, 100:1" },
      { text: "availability > consistency (views)" },
      { text: "playback start p95 < 200ms" },
      { text: "storage: ~30 PB / yr", annotation: "← drives cost tiering" }
    ]
  },
  entities: {
    boxes: [
      { name: "User", fields: ["id", "handle"], highlighted: false, position: { left: 10, top: 100, width: 150 }, rotation: -0.5 },
      { name: "Video", fields: ["id, uploaderId", "status: processing | live", "manifestUrl"], highlighted: true, position: { left: 230, top: 140, width: 170 }, rotation: 0.4 },
      { name: "Comment", fields: ["videoId, userId", "body"], highlighted: false, position: { left: 420, top: 230, width: 140 }, rotation: -0.6 }
    ],
    relationships: [
      { from: "User", to: "Video", cardinality: "1 : N", line: { x1: 150, y1: 120, x2: 230, y2: 150 } },
      { from: "Video", to: "Comment", cardinality: "1 : N", line: { x1: 360, y1: 200, x2: 420, y2: 240 } }
    ]
  },
  api: {
    endpoints: [
      { method: "POST", path: "/videos", comment: "// init resumable upload" },
      { method: "GET",  path: "/videos/:id/manifest" },
      { method: "GET",  path: "/search?q=&cursor=" },
      { method: "POST", path: "/videos/:id/comments" }
    ]
  },
  hld: {
    components: [
      { name: "Client", highlighted: false, position: { left: 30, top: 230, width: 140 }, rotation: -0.4 },
      { name: "CDN", highlighted: true, position: { left: 280, top: 96, width: 150 }, rotation: 0.3 },
      { name: "API gateway", highlighted: false, position: { left: 280, top: 262, width: 150 }, rotation: -0.3 },
      { name: "Upload service", highlighted: false, position: { left: 530, top: 190, width: 160 }, rotation: 0.4 },
      { name: "Object store\nraw + segments", highlighted: true, position: { left: 788, top: 96, width: 180 }, rotation: -0.3 },
      { name: "transcode queue", highlighted: false, position: { left: 532, top: 348, width: 160 }, rotation: 0.3 },
      { name: "Transcoder pool", highlighted: false, position: { left: 788, top: 348, width: 160 }, rotation: -0.4 },
      { name: "Metadata DB", highlighted: false, position: { left: 530, top: 490, width: 160 }, rotation: 0.3 },
      { name: "Cache", highlighted: false, position: { left: 282, top: 490, width: 140 }, rotation: -0.3 }
    ],
    arrows: [
      { x1: 172, y1: 218, x2: 278, y2: 248 },
      { x1: 172, y1: 192, x2: 278, y2: 110 },
      { x1: 432, y1: 248, x2: 528, y2: 180 },
      { x1: 690, y1: 160, x2: 788, y2: 110 },
      { x1: 610, y1: 200, x2: 610, y2: 308, label: { text: "enqueue", position: { left: 625, top: 290 } } },
      { x1: 692, y1: 336, x2: 786, y2: 336 },
      { x1: 868, y1: 308, x2: 878, y2: 140 },
      { x1: 382, y1: 276, x2: 528, y2: 452 },
      { x1: 352, y1: 276, x2: 352, y2: 450 },
      { x1: 432, y1: 86, x2: 786, y2: 86, dashed: true, bidir: true, label: { text: "pull segments", position: { left: 560, top: 100 }, rotation: -2 } }
    ]
  },
  deepDives: {
    circles: [
      { position: { left: 2120, top: 620, width: 480, height: 150 }, label: { text: "read path — every play hits this?", position: { left: 2600, top: 585 }, rotation: -1.5 }, rotation: -1 },
      { position: { left: 2100, top: 180, width: 200, height: 90 }, label: { text: "", position: { left: 0, top: 0 } }, rotation: 1 }
    ],
    items: [
      { text: "view counts at 1B/day → approximate counters, flush every 5s" },
      { text: "hot video stampede → request coalescing at cache layer" },
      { text: "transcode lag → autoscale workers on queue depth" }
    ]
  },
  guide: {
    0: {
      tips: ["Read once, slowly — note actors and verbs", "Decide what is out of scope and write it down", "Collapse the card once it's in your head"],
      suggestions: ["Actors: creator, viewer", "Verbs: upload, watch, search, comment"]
    },
    1: {
      tips: ["3–4 core requirements is plenty", "Write them as user actions, not features", "Mark anything out-of-scope explicitly"],
      suggestions: null,
      frSuggestions: {
        beginner: ["Upload a video", "Watch a video", "Search by title"],
        midLevel: ["Upload → process → watch", "Search and discovery", "Like / comment"],
        senior: ["Upload → transcode → adaptive playback", "Feed and search", "Engagement: views, likes, comments", "Resumable uploads (stretch)"]
      }
    },
    2: {
      tips: ["Quantify: DAU, QPS, storage per day", "Pick a CAP stance per flow, not globally", "Set a latency target for playback start"],
      suggestions: ["~1B DAU, read-heavy ≈100:1", "Availability over consistency for views", "p95 playback start < 200 ms"]
    },
    3: {
      tips: ["Pull nouns straight from your requirements", "Key fields only — no full schemas yet", "Note the 1:N relationships"],
      suggestions: ["User, Video, Comment", "Video: id, uploaderId, status, manifestUrl", "View events as an append-only stream"]
    },
    4: {
      tips: ["One endpoint per requirement to start", "Upload is multi-step — design it that way", "Paginate anything that lists"],
      suggestions: ["POST /videos — init resumable upload", "GET /videos/:id/manifest", "GET /search?q= with cursor"]
    },
    5: {
      tips: ["Trace one write path and one read path", "Name every arrow — protocol or payload", "Cache and CDN before you shard", "Keep transcoding asynchronous"],
      suggestions: ["Upload svc → object store → transcode queue", "CDN serves segments; cache serves metadata", "Keep the read path separate from upload"]
    },
    6: {
      tips: ["Hot videos: cache stampede", "View counting at 1B/day", "Transcode backpressure under upload spikes", "Storage cost — hot vs cold tiers"],
      suggestions: ["Approximate counters, periodic flush", "Request coalescing at the cache", "Autoscale transcoders on queue depth"]
    }
  },
  feedback: {
    1: [
      { tag: "✓", text: "Requirements are user-action shaped — good instinct." },
      { tag: "△", text: "Is search core for v1? You could park it and say so." },
      { tag: "○", text: "Nothing covers processing — uploaded ≠ watchable." }
    ],
    5: [
      { tag: "✓", text: "Clean async transcode path — upload never blocks on it." },
      { tag: "△", text: "Metadata DB sits on every play. Is the cache in front of it?" },
      { tag: "○", text: "How do segments reach the CDN — push or pull? Name the arrow." }
    ]
  }
}
```

---

### 8.2 Design TinyURL

```typescript
{
  problem: {
    title: "Design TinyURL",
    context: "A URL shortening service where users submit a long URL and get a short alias. Assume 100M URLs created per day, 10B redirects per day. Focus on the shorten→redirect path.",
    scopeNote: "In scope: shorten, redirect, custom alias, analytics. Out of scope: full analytics dashboard, link groups."
  },
  fr: {
    beginner: ["Shorten a URL", "Redirect to original", "Custom alias"],
    midLevel: ["Shorten → get short code", "Redirect short code → original URL", "Expiry / TTL"],
    senior: ["Shorten with custom alias + collision handling", "Sub-200ms redirect at 10B/day", "Link expiry and lazy cleanup", "Analytics (view count, per-region)"],
    outOfScope: ["Full analytics dashboard", "Link groups / folders"]
  },
  nfr: {
    bullets: [
      { text: "100M writes/day, 10B reads/day — 100:1 read:write" },
      { text: "Redirect p99 < 10ms", annotation: "← bottleneck is DB lookup" },
      { text: "HA — redirects must survive DB failover" },
      { text: "Storage: 100M × 500B ≈ 50 GB/day", annotation: "← cheap, NoSQL is fine" }
    ]
  },
  entities: {
    boxes: [
      { name: "ShortLink", fields: ["code (PK)", "originalUrl", "createdAt", "expiresAt", "userId?"], highlighted: true, position: { left: 10, top: 80, width: 200 }, rotation: -0.4 },
      { name: "User", fields: ["id", "email"], highlighted: false, position: { left: 280, top: 80, width: 130 }, rotation: 0.3 },
      { name: "ClickEvent", fields: ["code", "ts", "region", "referer"], highlighted: false, position: { left: 160, top: 240, width: 180 }, rotation: 0.5 }
    ],
    relationships: [
      { from: "User", to: "ShortLink", cardinality: "1 : N", line: { x1: 270, y1: 120, x2: 200, y2: 120 } },
      { from: "ShortLink", to: "ClickEvent", cardinality: "1 : N", line: { x1: 120, y1: 180, x2: 165, y2: 240 } }
    ]
  },
  api: {
    endpoints: [
      { method: "POST", path: "/shorten", comment: "// { longUrl, customAlias?, ttl? }" },
      { method: "GET",  path: "/:code",   comment: "// 301/302 redirect" },
      { method: "DELETE", path: "/links/:code", comment: "// owner only" },
      { method: "GET",  path: "/links/:code/stats" }
    ]
  },
  hld: {
    components: [
      { name: "Client", highlighted: false, position: { left: 20, top: 220, width: 120 }, rotation: -0.3 },
      { name: "Load\nBalancer", highlighted: false, position: { left: 200, top: 220, width: 130 }, rotation: 0.3 },
      { name: "Shorten\nService", highlighted: false, position: { left: 400, top: 150, width: 150 }, rotation: -0.4 },
      { name: "Redirect\nService", highlighted: true, position: { left: 400, top: 300, width: 150 }, rotation: 0.3 },
      { name: "Base62\nEncoder", highlighted: false, position: { left: 620, top: 150, width: 140 }, rotation: -0.3 },
      { name: "KV Store\n(Redis)", highlighted: true, position: { left: 620, top: 300, width: 140 }, rotation: 0.4 },
      { name: "NoSQL DB\n(Cassandra)", highlighted: false, position: { left: 830, top: 220, width: 160 }, rotation: -0.4 },
      { name: "Analytics\nQueue", highlighted: false, position: { left: 400, top: 450, width: 150 }, rotation: 0.3 }
    ],
    arrows: [
      { x1: 140, y1: 240, x2: 200, y2: 240 },
      { x1: 330, y1: 220, x2: 400, y2: 180, label: { text: "POST /shorten", position: { left: 340, top: 190 }, rotation: -6 } },
      { x1: 330, y1: 240, x2: 400, y2: 320, label: { text: "GET /:code", position: { left: 335, top: 295 }, rotation: 6 } },
      { x1: 550, y1: 180, x2: 620, y2: 180 },
      { x1: 550, y1: 320, x2: 620, y2: 320, label: { text: "cache lookup", position: { left: 555, top: 305 } } },
      { x1: 760, y1: 280, x2: 830, y2: 250 },
      { x1: 760, y1: 320, x2: 760, y2: 450 }
    ]
  },
  deepDives: {
    circles: [
      { position: { left: 2050, top: 500, width: 200, height: 80 }, label: { text: "cache miss at 10B/day?", position: { left: 2260, top: 510 }, rotation: -1 }, rotation: -0.5 }
    ],
    items: [
      { text: "collision handling → check DB on conflict, retry with new hash" },
      { text: "redirect latency → Redis hot tier, 99% cache hit rate target" },
      { text: "expiry cleanup → lazy (check on redirect) + nightly TTL sweep" }
    ]
  },
  guide: {
    0: { tips: ["Note: shorten vs redirect are separate flows", "Identify the read:write ratio first", "Custom alias is a nice-to-have"], suggestions: ["100M writes vs 10B reads", "Focus on redirect performance"] },
    1: { tips: ["Core: shorten + redirect", "Expiry is important — how do you clean up?", "Analytics: what does the owner need?"], suggestions: null, frSuggestions: { beginner: ["Shorten a URL", "Redirect to original", "Custom alias"], midLevel: ["Shorten → unique code", "Redirect with <10ms p99", "Expiry"], senior: ["Shorten w/ custom alias + collision", "Sub-10ms redirect at scale", "Lazy cleanup + TTL", "Click analytics"] } },
    2: { tips: ["Quantify the read:write imbalance", "Redirect is the bottleneck — optimize for it", "Storage is cheap — don't over-engineer"], suggestions: ["100:1 read:write ratio", "Redirect p99 < 10ms", "50 GB/day — NoSQL is fine"] },
    3: { tips: ["ShortLink is the core entity — design it first", "ClickEvent is append-only — event log", "User is optional — anonymous links?"], suggestions: ["ShortLink: code, originalUrl, expiresAt", "ClickEvent: code, ts, region"] },
    4: { tips: ["POST /shorten returns the code", "GET /:code is a pure redirect — no JSON", "Stats endpoint is separate from redirect"], suggestions: ["POST /shorten → 201 { shortUrl }", "GET /:code → 301 Location: originalUrl"] },
    5: { tips: ["Redirect service is hot path — keep it simple", "Redis fronts the DB for redirect lookups", "Shorten service writes to DB then warms cache"], suggestions: ["Shorten → Base62 encode → write DB → warm Redis", "Redirect → Redis hit → 301; miss → DB → Redis → 301"] },
    6: { tips: ["Cache miss rate at 10B/day", "Collision probability at 100M codes", "Hot link stampede (viral URL)"], suggestions: ["Zookeeper-based counter for Base62", "Request coalescing on cache miss", "Lazy expiry + TTL in Redis"] }
  },
  feedback: {
    1: [{ tag: "✓", text: "Good: shorten and redirect as separate flows." }, { tag: "△", text: "Analytics — is it core or stretch? Say so explicitly." }, { tag: "○", text: "Collision handling is missing — what if Base62 code is taken?" }],
    5: [{ tag: "✓", text: "Redis in front of DB is correct for redirect." }, { tag: "△", text: "Base62 encoder — is it a service or library? Clarify." }, { tag: "○", text: "Expiry flow missing — how does the system detect and handle expired links?" }]
  }
}
```

---

### 8.3 Design Twitter / X

```typescript
{
  problem: {
    title: "Design Twitter / X",
    context: "A social platform where users post short messages (tweets), follow others, and see a personalized timeline. Assume 300M DAU, 600M tweets/day, and that home timeline is the critical read path.",
    scopeNote: "In scope: tweet, timeline, follow, search. Out of scope: DMs, spaces, trending."
  },
  fr: { beginner: ["Post a tweet", "Follow a user", "View home timeline"], midLevel: ["Post tweet (≤280 chars)", "Follow/unfollow", "Home timeline with ranking"], senior: ["Tweet with media", "Fan-out-on-write vs pull for timeline", "Search (full-text + hashtag)", "Notifications"], outOfScope: ["DMs", "Spaces / live audio"] },
  nfr: { bullets: [{ text: "300M DAU, 600M tweets/day — write QPS ≈ 7K" }, { text: "Read QPS ≈ 300K (home timeline)", annotation: "← 40:1 reads" }, { text: "Timeline freshness < 5s after tweet" }, { text: "Availability > consistency (eventually consistent timeline)"}] },
  entities: {
    boxes: [
      { name: "User", fields: ["id", "handle", "followerCount"], highlighted: false, position: { left: 10, top: 80, width: 160 }, rotation: -0.4 },
      { name: "Tweet", fields: ["id (snowflake)", "authorId", "text", "mediaUrl?", "createdAt"], highlighted: true, position: { left: 240, top: 100, width: 180 }, rotation: 0.5 },
      { name: "Follow", fields: ["followerId", "followeeId", "createdAt"], highlighted: false, position: { left: 10, top: 250, width: 160 }, rotation: 0.3 },
      { name: "Timeline\nCache", fields: ["userId", "tweetIds[]", "cursor"], highlighted: false, position: { left: 430, top: 200, width: 140 }, rotation: -0.4 }
    ],
    relationships: [
      { from: "User", to: "Tweet", cardinality: "1 : N", line: { x1: 160, y1: 120, x2: 240, y2: 140 } },
      { from: "User", to: "Follow", cardinality: "1 : N", line: { x1: 80, y1: 200, x2: 80, y2: 250 } }
    ]
  },
  api: {
    endpoints: [
      { method: "POST", path: "/tweets", comment: "// { text, mediaIds? }" },
      { method: "GET",  path: "/timeline?cursor=", comment: "// paginated" },
      { method: "POST", path: "/users/:id/follow" },
      { method: "GET",  path: "/search?q=&cursor=" }
    ]
  },
  hld: {
    components: [
      { name: "Client", highlighted: false, position: { left: 20, top: 230, width: 120 }, rotation: -0.3 },
      { name: "API Gateway", highlighted: false, position: { left: 200, top: 230, width: 140 }, rotation: 0.3 },
      { name: "Tweet Service", highlighted: false, position: { left: 420, top: 140, width: 150 }, rotation: -0.4 },
      { name: "Fan-out\nService", highlighted: true, position: { left: 640, top: 140, width: 150 }, rotation: 0.4 },
      { name: "Timeline\nService", highlighted: true, position: { left: 420, top: 330, width: 150 }, rotation: 0.3 },
      { name: "Redis\n(timeline cache)", highlighted: false, position: { left: 640, top: 330, width: 170 }, rotation: -0.4 },
      { name: "Tweet DB\n(Cassandra)", highlighted: false, position: { left: 860, top: 140, width: 160 }, rotation: 0.3 },
      { name: "Graph DB\n(follows)", highlighted: false, position: { left: 860, top: 330, width: 150 }, rotation: -0.3 },
      { name: "Search\n(Elasticsearch)", highlighted: false, position: { left: 420, top: 500, width: 170 }, rotation: 0.4 }
    ],
    arrows: [
      { x1: 140, y1: 250, x2: 200, y2: 250 },
      { x1: 340, y1: 230, x2: 420, y2: 180 },
      { x1: 340, y1: 250, x2: 420, y2: 360 },
      { x1: 570, y1: 180, x2: 640, y2: 180, label: { text: "fan-out", position: { left: 575, top: 162 } } },
      { x1: 790, y1: 180, x2: 860, y2: 180 },
      { x1: 570, y1: 360, x2: 640, y2: 360, label: { text: "read timeline", position: { left: 570, top: 342 } } },
      { x1: 810, y1: 360, x2: 860, y2: 360 }
    ]
  },
  deepDives: {
    circles: [
      { position: { left: 2090, top: 330, width: 220, height: 80 }, label: { text: "celebrities: fan-out at 150M followers?", position: { left: 2320, top: 340 }, rotation: -1 }, rotation: -0.5 }
    ],
    items: [
      { text: "celebrity problem → hybrid: push for regular users, pull for celebrities (>1M followers)" },
      { text: "timeline cache miss → on-demand build from Graph DB + Tweet DB" },
      { text: "tweet storm → backpressure in fan-out queue, workers auto-scale on depth" }
    ]
  },
  guide: {
    0: { tips: ["Timeline is the critical path — optimize for it", "Fan-out strategy defines the architecture", "Celebrities are the key edge case"], suggestions: ["300M DAU, 300K read QPS for timeline", "Fan-out: push vs pull vs hybrid"] },
    1: { tips: ["Start with the core loop: post + read timeline", "Follow is what makes timeline possible", "Rank later — recency first"], suggestions: null, frSuggestions: { beginner: ["Post a tweet", "Follow a user", "See timeline"], midLevel: ["Post tweet", "Home timeline (chronological)", "Follow/unfollow"], senior: ["Tweet + fan-out", "Ranked timeline (engagement signals)", "Search + hashtags", "Notifications"] } },
    2: { tips: ["Write QPS is manageable; read QPS is the problem", "Timeline freshness SLA", "Eventual consistency is acceptable for timeline"], suggestions: ["Read QPS ≈ 300K", "Freshness < 5s for home timeline", "Availability > consistency"] },
    3: { tips: ["Tweet is the core entity — Snowflake ID for sorting", "Follow is a graph edge", "Timeline is a derived view, not a source of truth"], suggestions: ["Tweet: snowflake id, authorId, text, ts", "Follow: followerId, followeeId", "Timeline cache: userId → tweetId list"] },
    4: { tips: ["POST /tweets triggers fan-out, don't block on it", "GET /timeline is cursor-paginated", "Follow is idempotent POST"], suggestions: ["POST /tweets → 201 { tweetId }", "GET /timeline?cursor= → paginated tweet list"] },
    5: { tips: ["Fan-out service is the key component — draw it clearly", "Redis caches timelines (pre-computed)", "Pull path exists for cache miss or celeb case"], suggestions: ["Write path: Tweet → Fan-out → Redis (N timelines)", "Read path: Timeline Service → Redis → merge celeb tweets"] },
    6: { tips: ["Celebrity problem (150M followers fan-out)", "Cache miss on timeline", "Tweet storm (viral event)"], suggestions: ["Hybrid push/pull at follower threshold", "On-demand build on cache miss", "Fan-out queue depth → auto-scale workers"] }
  },
  feedback: {
    1: [{ tag: "✓", text: "Good — post and timeline are the right core pair." }, { tag: "△", text: "Ranking: is chronological timeline enough for v1?" }, { tag: "○", text: "Fan-out strategy is missing — what happens when tweet is posted?" }],
    5: [{ tag: "✓", text: "Fan-out service is correctly async." }, { tag: "△", text: "Celebrity case — does your fan-out handle 150M followers?" }, { tag: "○", text: "Cache miss path is not drawn — what happens when timeline isn't in Redis?" }]
  }
}
```

---

### 8.4 Design Uber

```typescript
{
  problem: {
    title: "Design Uber",
    context: "A ride-hailing marketplace that matches riders with nearby drivers in real time. Assume 1M active drivers sending location updates every 4 seconds. The critical path is ride request → driver match → acceptance.",
    scopeNote: "In scope: request ride, match, accept, track. Out of scope: pricing surge, route optimization, payments."
  },
  fr: { beginner: ["Request a ride", "Accept a ride (driver)", "Track ride in real time"], midLevel: ["Request → match nearby driver", "Driver location updates", "ETA to pickup"], senior: ["Request → geo match → driver accept → track", "Real-time driver location (1M updates/4s)", "Trip state machine", "Surge pricing (stretch)"], outOfScope: ["Route optimization", "Payments", "Surge pricing"] },
  nfr: { bullets: [{ text: "1M drivers × 1 update/4s = 250K location writes/sec" }, { text: "Match latency < 1s from request" }, { text: "Driver location freshness < 5s" }, { text: "Availability >> consistency", annotation: "← stale driver pos is okay; duplicate match is not" }] },
  entities: {
    boxes: [
      { name: "Driver", fields: ["id", "lat, lng", "status: free|busy", "lastSeen"], highlighted: false, position: { left: 10, top: 60, width: 170 }, rotation: -0.4 },
      { name: "Trip", fields: ["id", "riderId", "driverId", "status", "pickupLoc", "dropLoc"], highlighted: true, position: { left: 250, top: 100, width: 190 }, rotation: 0.4 },
      { name: "Rider", fields: ["id", "paymentMethod"], highlighted: false, position: { left: 10, top: 240, width: 150 }, rotation: 0.3 }
    ],
    relationships: [
      { from: "Driver", to: "Trip", cardinality: "1 : 1", line: { x1: 170, y1: 120, x2: 250, y2: 150 } },
      { from: "Rider", to: "Trip", cardinality: "1 : N", line: { x1: 110, y1: 240, x2: 260, y2: 200 } }
    ]
  },
  api: {
    endpoints: [
      { method: "POST", path: "/trips", comment: "// rider requests ride" },
      { method: "PATCH", path: "/trips/:id/accept", comment: "// driver accepts" },
      { method: "POST", path: "/drivers/location", comment: "// driver sends lat/lng" },
      { method: "GET",  path: "/trips/:id/track", comment: "// SSE stream" }
    ]
  },
  hld: {
    components: [
      { name: "Rider App", highlighted: false, position: { left: 20, top: 180, width: 130 }, rotation: -0.3 },
      { name: "Driver App", highlighted: false, position: { left: 20, top: 340, width: 130 }, rotation: 0.3 },
      { name: "API Gateway", highlighted: false, position: { left: 220, top: 260, width: 140 }, rotation: -0.3 },
      { name: "Location\nService", highlighted: true, position: { left: 440, top: 340, width: 150 }, rotation: 0.4 },
      { name: "Geo Index\n(Geohash/QuadTree)", highlighted: true, position: { left: 670, top: 340, width: 190 }, rotation: -0.4 },
      { name: "Match\nService", highlighted: false, position: { left: 440, top: 160, width: 150 }, rotation: -0.3 },
      { name: "Trip DB\n(Postgres)", highlighted: false, position: { left: 680, top: 160, width: 160 }, rotation: 0.3 },
      { name: "Notification\nService", highlighted: false, position: { left: 440, top: 500, width: 160 }, rotation: 0.4 }
    ],
    arrows: [
      { x1: 150, y1: 200, x2: 220, y2: 270 },
      { x1: 150, y1: 360, x2: 220, y2: 270 },
      { x1: 360, y1: 260, x2: 440, y2: 200, label: { text: "request ride", position: { left: 365, top: 225 }, rotation: -15 } },
      { x1: 360, y1: 270, x2: 440, y2: 360, label: { text: "update loc", position: { left: 363, top: 325 }, rotation: 12 } },
      { x1: 590, y1: 360, x2: 670, y2: 360 },
      { x1: 590, y1: 200, x2: 680, y2: 200 },
      { x1: 590, y1: 220, x2: 460, y2: 500 }
    ]
  },
  deepDives: {
    circles: [
      { position: { left: 2110, top: 490, width: 220, height: 80 }, label: { text: "250K writes/sec — single point?", position: { left: 2340, top: 500 }, rotation: -1.5 }, rotation: -1 }
    ],
    items: [
      { text: "location write flood → partition Location Service by geohash prefix; each shard owns a region" },
      { text: "match latency → keep drivers in Redis geo sorted set (GEORADIUS), update every 4s" },
      { text: "driver goes offline mid-match → Trip state machine: REQUESTED → MATCHED (timeout 30s) → EXPIRED" }
    ]
  },
  guide: {
    0: { tips: ["Location updates at 250K/sec are the bottleneck", "Match latency < 1s is the hard constraint", "Trip state machine is central"], suggestions: ["1M drivers × 1 update/4s = 250K write QPS", "Match: geo proximity + driver availability"] },
    1: { tips: ["Three actors: rider, driver, system (matchmaker)", "Driver location is a write-heavy stream", "Trip has a clear state machine"], suggestions: null, frSuggestions: { beginner: ["Request a ride", "Accept a ride", "Track driver"], midLevel: ["Request → match → accept", "Driver location stream", "Trip state (requested, in-progress, done)"], senior: ["Request → geo match < 1s", "Driver heartbeat at 250K/sec", "Trip state machine with timeouts", "Surge pricing (stretch)"] } },
    2: { tips: ["250K location writes/sec is the key number", "Match latency SLA is 1s — it drives design", "Availability > consistency for driver position"], suggestions: ["250K location writes/sec", "Match latency < 1s", "Driver freshness < 5s"] },
    3: { tips: ["Driver has lat/lng and status — both are hot writes", "Trip is the transaction record", "Rider is simpler — focus on Driver and Trip"], suggestions: ["Driver: id, lat, lng, status, lastSeen", "Trip: id, riderId, driverId, status, pickup, drop"] },
    4: { tips: ["POST /trips triggers the match — don't block on match result", "Driver location is a write-heavy stream endpoint", "Trip tracking via SSE or WebSocket"], suggestions: ["POST /trips → async match", "POST /drivers/location → write to geo index", "GET /trips/:id/track → SSE stream"] },
    5: { tips: ["Location Service partitioned by geohash", "Geo Index (Redis GEORADIUS) for match", "Match Service queries geo, picks best driver"], suggestions: ["Driver App → Location Service → Redis GeoSet", "Match: GEORADIUS → top N candidates → assign"] },
    6: { tips: ["250K writes/sec to Location Service", "Match latency at high concurrency", "Driver goes offline during match"], suggestions: ["Partition Location Service by geohash shard", "Redis GeoSet for O(log N) radius queries", "Trip state machine with 30s match timeout"] }
  },
  feedback: {
    1: [{ tag: "✓", text: "Good — three actors mapped correctly." }, { tag: "△", text: "Trip state machine: list the states and transitions." }, { tag: "○", text: "Driver location stream is missing — 250K writes/sec needs its own service." }],
    5: [{ tag: "✓", text: "Geo index is correctly identified as the key structure." }, { tag: "△", text: "How does Location Service partition at 250K writes/sec?" }, { tag: "○", text: "Match timeout and retry — what happens when driver doesn't accept?" }]
  }
}
```

---

### 8.5 Design WhatsApp

```typescript
{
  problem: { title: "Design WhatsApp", context: "An end-to-end encrypted messaging platform. 2B users, 100B messages/day. Focus on 1:1 chat with delivery receipts (sent, delivered, read). Group chat and media are stretch.", scopeNote: "In scope: 1:1 chat, online status, receipts. Out of scope: group chat > 256, voice/video calls." },
  fr: { beginner: ["Send a message", "Receive a message", "See online status"], midLevel: ["Send message → delivered receipt", "Read receipt", "Offline message queuing"], senior: ["Persistent WebSocket connection per client", "Store-and-forward for offline users", "E2E encryption (Signal protocol)", "Group chat up to 256 (stretch)"], outOfScope: ["Group chat > 256", "Voice / video calls"] },
  nfr: { bullets: [{ text: "100B messages/day — 1.15M msg/sec" }, { text: "Message delivery p99 < 500ms (online)", annotation: "← WebSocket path" }, { text: "Exactly-once delivery (no duplicates)" }, { text: "E2E encrypted — server never sees plaintext" }] },
  entities: {
    boxes: [
      { name: "User", fields: ["id", "phoneHash", "publicKey", "lastSeen"], highlighted: false, position: { left: 10, top: 80, width: 170 }, rotation: -0.4 },
      { name: "Message", fields: ["id", "senderId", "recipientId", "ciphertext", "ts", "status"], highlighted: true, position: { left: 250, top: 100, width: 190 }, rotation: 0.4 },
      { name: "Conversation", fields: ["id", "participants[]", "lastMsgId"], highlighted: false, position: { left: 10, top: 260, width: 170 }, rotation: 0.3 }
    ],
    relationships: [
      { from: "User", to: "Message", cardinality: "1 : N", line: { x1: 170, y1: 120, x2: 250, y2: 150 } },
      { from: "Conversation", to: "Message", cardinality: "1 : N", line: { x1: 110, y1: 280, x2: 265, y2: 260 } }
    ]
  },
  api: {
    endpoints: [
      { method: "POST", path: "/messages", comment: "// send message" },
      { method: "GET",  path: "/messages?convId=&cursor=", comment: "// history" },
      { method: "PATCH", path: "/messages/:id/receipt", comment: "// delivered | read" },
      { method: "GET",  path: "/users/:id/status" }
    ]
  },
  hld: {
    components: [
      { name: "Client A", highlighted: false, position: { left: 20, top: 200, width: 120 }, rotation: -0.3 },
      { name: "Client B", highlighted: false, position: { left: 20, top: 360, width: 120 }, rotation: 0.3 },
      { name: "WS Gateway\n(per-region)", highlighted: true, position: { left: 220, top: 280, width: 170 }, rotation: -0.3 },
      { name: "Chat Service", highlighted: false, position: { left: 470, top: 200, width: 150 }, rotation: 0.4 },
      { name: "Message Queue\n(Kafka)", highlighted: false, position: { left: 470, top: 360, width: 170 }, rotation: -0.4 },
      { name: "Message Store\n(Cassandra)", highlighted: false, position: { left: 720, top: 200, width: 180 }, rotation: 0.3 },
      { name: "Presence\nService", highlighted: false, position: { left: 720, top: 360, width: 150 }, rotation: -0.3 },
      { name: "Push\n(APNS/FCM)", highlighted: false, position: { left: 470, top: 500, width: 150 }, rotation: 0.3 }
    ],
    arrows: [
      { x1: 140, y1: 220, x2: 220, y2: 290, label: { text: "WS conn", position: { left: 150, top: 250 }, rotation: 20 } },
      { x1: 140, y1: 360, x2: 220, y2: 290 },
      { x1: 390, y1: 280, x2: 470, y2: 230, label: { text: "send msg", position: { left: 400, top: 250 }, rotation: -12 } },
      { x1: 390, y1: 285, x2: 470, y2: 380 },
      { x1: 620, y1: 230, x2: 720, y2: 230 },
      { x1: 620, y1: 380, x2: 720, y2: 380 },
      { x1: 540, y1: 400, x2: 540, y2: 500 },
      { x1: 870, y1: 380, x2: 390, y2: 290, dashed: true }
    ]
  },
  deepDives: {
    circles: [{ position: { left: 2080, top: 370, width: 200, height: 80 }, label: { text: "1.15M msg/sec — Cassandra hot?", position: { left: 2290, top: 380 }, rotation: -1 }, rotation: -0.5 }],
    items: [
      { text: "E2E encryption → Signal protocol: X3DH key exchange, Double Ratchet for forward secrecy" },
      { text: "offline delivery → Kafka retains messages; push via APNS/FCM; client acks on reconnect" },
      { text: "message ordering → Cassandra partition key = conversationId, clustering key = ts (descending)" }
    ]
  },
  guide: {
    0: { tips: ["WebSocket is the core transport — not REST", "E2E encryption means server never decrypts", "Store-and-forward for offline users"], suggestions: ["1.15M messages/sec", "Persistent WS per client"] },
    1: { tips: ["Core: send + receive + receipt", "Online/offline status is its own challenge", "E2E encryption is a hard constraint, not optional"], suggestions: null, frSuggestions: { beginner: ["Send a message", "Receive a message", "See online status"], midLevel: ["Send → delivered receipt", "Read receipt", "Offline queuing"], senior: ["Persistent WS + store-and-forward", "E2E encryption (Signal)", "Group chat up to 256", "Push for offline"] } },
    2: { tips: ["Delivery latency is tight (500ms p99)", "Exactly-once is hard — idempotency keys", "E2E means server stores ciphertext only"], suggestions: ["1.15M msg/sec", "p99 < 500ms delivery", "Exactly-once (no duplicates)"] },
    3: { tips: ["Message is the core entity", "Conversation is the partition boundary for storage", "Presence is separate — don't mix with message"], suggestions: ["Message: id, senderId, recipientId, ciphertext, ts, status", "Partition by conversationId in Cassandra"] },
    4: { tips: ["WS for send — not REST POST for latency", "Receipt is a PATCH on message", "Status API can be polling or WS event"], suggestions: ["WS: send { to, ciphertext, clientId }", "WS push: { msgId, status: delivered|read }"] },
    5: { tips: ["WS Gateway holds millions of connections", "Chat Service routes via Kafka for durability", "Cassandra partitioned by conversationId"], suggestions: ["Client → WS Gateway → Chat Service → Kafka → Cassandra", "Kafka consumer → WS push to recipient if online, else APNS/FCM"] },
    6: { tips: ["Key exchange for E2E (X3DH)", "Message ordering in Cassandra", "Delivery guarantee (at-least-once + dedup)"], suggestions: ["Signal protocol: X3DH + Double Ratchet", "Cassandra partition by convId, cluster by ts DESC", "Client-side dedup with message UUID"] }
  },
  feedback: {
    1: [{ tag: "✓", text: "Receipts are correctly identified as a requirement." }, { tag: "△", text: "E2E encryption — is this core v1 or stretch?" }, { tag: "○", text: "Offline delivery is missing — what happens when recipient is offline?" }],
    5: [{ tag: "✓", text: "WS Gateway is correctly placed for persistent connections." }, { tag: "△", text: "WS Gateway shards — how do you route B's message to B's connection?" }, { tag: "○", text: "Online status propagation path is not drawn." }]
  }
}
```

---

### 8.6 Design Rate Limiter

```typescript
{
  problem: { title: "Design a Rate Limiter", context: "A distributed rate limiter that throttles API requests per user or IP. Target: 100K QPS, sub-millisecond decision latency, works across multiple API servers.", scopeNote: "In scope: token bucket, sliding window, distributed state. Out of scope: per-route rules UI, billing integration." },
  fr: { beginner: ["Allow or deny a request", "Set a rate limit per user", "Return 429 on exceed"], midLevel: ["Throttle by user ID or IP", "Configurable limits per endpoint", "Return Retry-After header"], senior: ["Token bucket at 100K QPS < 1ms", "Distributed counter (no single point)", "Multi-rule: per-user, per-IP, per-endpoint", "Soft limit (throttle) vs hard limit (block)"], outOfScope: ["Rules management UI", "Billing rate limits"] },
  nfr: { bullets: [{ text: "100K QPS decision throughput" }, { text: "Decision latency < 1ms p99", annotation: "← in-process or Redis single-hop" }, { text: "Distributed: works across 100 API servers" }, { text: "Accuracy: allow ≤ (limit + 1) requests per window" }] },
  entities: {
    boxes: [
      { name: "RateLimit\nRule", fields: ["ruleId", "entityType (user|ip)", "limit", "windowSecs"], highlighted: false, position: { left: 10, top: 60, width: 180 }, rotation: -0.4 },
      { name: "Counter", fields: ["entityId", "windowStart", "count"], highlighted: true, position: { left: 260, top: 100, width: 160 }, rotation: 0.4 },
      { name: "Request\nLog", fields: ["entityId", "ts", "allowed"], highlighted: false, position: { left: 10, top: 250, width: 160 }, rotation: 0.3 }
    ],
    relationships: [
      { from: "RateLimit Rule", to: "Counter", cardinality: "1 : N", line: { x1: 180, y1: 100, x2: 260, y2: 130 } }
    ]
  },
  api: {
    endpoints: [
      { method: "POST", path: "/check", comment: "// { entityId, entityType } → { allowed, retryAfter? }" },
      { method: "POST", path: "/rules", comment: "// create a rate limit rule" },
      { method: "GET",  path: "/rules/:entityId" },
      { method: "DELETE", path: "/rules/:ruleId" }
    ]
  },
  hld: {
    components: [
      { name: "API Server", highlighted: false, position: { left: 20, top: 200, width: 130 }, rotation: -0.3 },
      { name: "Rate Limiter\nMiddleware", highlighted: true, position: { left: 230, top: 200, width: 170 }, rotation: 0.4 },
      { name: "Rule Cache\n(in-process)", highlighted: false, position: { left: 480, top: 140, width: 170 }, rotation: -0.4 },
      { name: "Redis\n(counters)", highlighted: true, position: { left: 480, top: 300, width: 150 }, rotation: 0.3 },
      { name: "Rule DB\n(Postgres)", highlighted: false, position: { left: 710, top: 140, width: 150 }, rotation: -0.3 },
      { name: "Counter\nBackfill (Lua)", highlighted: false, position: { left: 710, top: 300, width: 170 }, rotation: 0.4 }
    ],
    arrows: [
      { x1: 150, y1: 220, x2: 230, y2: 220, label: { text: "request", position: { left: 158, top: 205 } } },
      { x1: 400, y1: 200, x2: 480, y2: 175 },
      { x1: 400, y1: 225, x2: 480, y2: 315 },
      { x1: 650, y1: 175, x2: 710, y2: 175 },
      { x1: 630, y1: 315, x2: 710, y2: 315, label: { text: "INCR (Lua atomic)", position: { left: 628, top: 297 } } }
    ]
  },
  deepDives: {
    circles: [{ position: { left: 2060, top: 390, width: 180, height: 80 }, label: { text: "race condition on INCR?", position: { left: 2250, top: 400 }, rotation: -1 }, rotation: -0.5 }],
    items: [
      { text: "race condition → Lua script: GET + compare + INCR atomic, no TOCTOU window" },
      { text: "sliding window log (most accurate) is O(N) per request — too expensive at 100K QPS; use sliding window counter instead" },
      { text: "clock skew across 100 servers → Redis as single source of truth for counter; local clocks only for window key computation" }
    ]
  },
  guide: {
    0: { tips: ["Sub-millisecond is the key constraint", "Distributed = can't use local counters", "Algorithm choice drives everything"], suggestions: ["100K QPS, < 1ms decision", "Token bucket vs sliding window"] },
    1: { tips: ["Start with the decision: allow or deny?", "Multi-tenancy: by user, IP, endpoint", "What does the caller get on throttle?"], suggestions: null, frSuggestions: { beginner: ["Allow or block a request", "Set limit per user", "Return 429"], midLevel: ["Token bucket per user/IP", "Configurable per endpoint", "Retry-After header"], senior: ["< 1ms at 100K QPS", "Multi-rule (user + IP + endpoint)", "Soft throttle vs hard block", "Distributed (no local state)"] } },
    2: { tips: ["Decision latency < 1ms is the hard constraint", "Distributed means Redis, not local", "Accuracy vs speed trade-off"], suggestions: ["100K QPS, < 1ms p99", "Works across 100 API servers", "Allow ≤ (limit + 1) per window"] },
    3: { tips: ["Counter is the hot entity — millions per second", "Rule is config — read-heavy, write-rare", "Request log is optional — for audit only"], suggestions: ["Counter: entityId, windowKey, count", "Rule: entityType, limit, windowSecs"] },
    4: { tips: ["POST /check is the hot path — make it fast", "Rule management is cold path", "Response includes Retry-After header"], suggestions: ["POST /check → { allowed: bool, retryAfter?: secs }", "Caller adds X-RateLimit-Remaining header"] },
    5: { tips: ["Middleware is in-process for sub-ms latency", "Redis holds counters — single INCR call", "Rules cached in-process, refreshed every 60s"], suggestions: ["Request → Middleware → Redis INCR → allow/deny", "Lua script for atomic check-and-increment"] },
    6: { tips: ["Race condition on INCR", "Algorithm comparison: token bucket vs sliding window", "Clock skew across servers"], suggestions: ["Lua script: atomic GET + compare + INCR", "Sliding window counter (not log) for O(1)", "Redis as time source for window keys"] }
  },
  feedback: {
    1: [{ tag: "✓", text: "Good — throttle decision is the core." }, { tag: "△", text: "Multi-tenancy: per-user AND per-IP, or one of them?" }, { tag: "○", text: "Distributed state is missing — single server or across 100?" }],
    5: [{ tag: "✓", text: "Middleware placement is correct — in-process for < 1ms." }, { tag: "△", text: "Redis atomicity — are you using INCR or a Lua script? Matters for accuracy." }, { tag: "○", text: "Rule cache refresh strategy not shown — how does middleware pick up rule changes?" }]
  }
}
```

---

### 8.7 Design Distributed Cache

*(Abbreviated — follow the same pattern as above)*

Key differentiators: consistent hashing for sharding, LRU eviction, replication strategy, write-through vs write-back, CAP trade-off (CP for strict consistency, AP for availability).

FR: `put(k,v,ttl)`, `get(k)`, eviction on full. NFR: sub-ms get/put, TB-scale, 100K QPS. Entities: CacheNode, CacheEntry (key, value, expiresAt, lastAccessed), ConsistentHashRing. HLD: Client → Hash Router → Shard[N] → (optional replica set). Deep dives: hot key problem (local shard cache), consistent hashing node add/remove, replication lag during failover.

---

### 8.8 Design Parking Lot (OOD)

This problem has a different stage structure because it is an OOD (Object-Oriented Design) problem, not a distributed systems problem. The stages are the same (Problem → FR → NFR → Entities → API → HLD → Deep Dives) but the content changes:

- **Entities** = classes, not DB tables (ParkingLot, Level, Spot, Vehicle, Ticket, Payment)
- **API** = methods, not HTTP endpoints (enter(vehicleType) → Ticket, exit(ticket) → Payment)
- **HLD** = class diagram / collaboration diagram, not architecture diagram
- **NFR** = thread safety, no double allocation, payment outage resilience
- **Deep dives** = concurrency (SELECT FOR UPDATE vs optimistic lock), nearest-spot algorithm (min-heap per level/size), payment outage fail-open

The canvas regions use the same coordinates but the content renderer checks `problem.isOOD` to switch rendering mode.

---

### 8.9 All Other Problems

The following problems follow the same `ProblemCanvasData` structure. The key data points per problem are:

| Problem | Primary Entity | Key NFR | Deep Dive 1 | Deep Dive 2 | Deep Dive 3 |
|---|---|---|---|---|---|
| Instagram | Photo | 500M DAU, 1B photos/day | Feed generation fan-out | Hot photo CDN | Media dedup |
| Netflix | Video | Global, ABR streaming | Transcoding DAG | CDN preloading (Open Connect) | ABR algorithm |
| Google Search | Document | Petabyte index | Crawler politeness | Inverted index sharding | PageRank at scale |
| Dropbox | File chunk | Cross-device sync | Chunking/dedup | Delta sync | Conflict resolution |
| Typeahead | TrieNode | < 100ms at Google scale | Trie sharding | Top-k at each node | Offline update |
| Unique ID | Snowflake bits | 10K IDs/sec, sortable | Clock skew | Machine ID allocation | Sequence overflow |
| Leaderboard | Score entry | 10M DAU, 100K updates/sec | Redis ZSet hot key | Regional leaderboards | Score accuracy |
| Notification | Notification | 10M/minute | APNS/FCM rate limits | Fan-out to 1M devices | Retry / dedup |
| Key-Value Store | KV pair | TB RAM, 100K QPS | Consistent hashing add/remove | Hot key | Replication |
| Message Queue | Message | 1M msg/sec throughput | Consumer group rebalance | At-least-once dedup | Partition ordering |
| Load Balancer | Server health | 1M RPS | Health check failure | Sticky sessions | SSL termination |
| CDN | Edge node | TTFB < 20ms globally | Cache invalidation | Origin shield | Geo-routing |
| Web Crawler | URL | 10B URLs, politeness | Duplicate detection (Bloom filter) | URL priority queue | Politeness throttle |
| LRU Cache | Cache entry | O(1) get + put | Concurrent access | Cache size trade-offs | Eviction storm |
| Elevator System | Elevator car | 30s avg wait, 8 cars | LOOK vs FCFS algorithm | Dispatcher failover | Rush hour zoning |

---

## 9. Interaction Model

### 9.1 Writing on Canvas

Each canvas region exposes editable areas:
- **FR cards:** `contenteditable` divs styled as Caveat cards. Each card saves on blur.
- **NFR list:** `contenteditable` div with the full list. Saves on blur.
- **Entities:** Double-click entity card to edit name and fields (inline).
- **API block:** `contenteditable` monospace div. Auto-colors POST/GET etc.
- **HLD:** Text labels on components are editable. Free-draw tool available (Excalidraw integration or canvas drawing).
- **Deep dives:** `contenteditable` list items.

### 9.2 AI "Read my Canvas" Feedback

1. User clicks "Read my canvas" in guide rail footer
2. State transitions to `loading` — shimmer animation shown
3. API call: `POST /api/ai/canvas-feedback` with `{ stage, problemSlug, canvasContent }`
4. Server collects all editable content for current stage
5. AI evaluates and returns `[{ tag, text }]` array (3 items max)
6. State transitions to `done` — feedback notes shown with fadeUp
7. User dismisses with "dismiss" link — state returns to `idle`

**Fallback:** Until live AI, use the static feedback arrays in `ProblemCanvasData.feedback`.

### 9.3 Session Persistence

- `canvasContent` is saved to localStorage on every edit (debounced 500ms)
- On mount, restore from localStorage if matching `problemSlug`
- Server sync: on stage advance, POST `canvasContent` to `/api/practice/canvas-progress`
- Existing `ProblemProgress` model extended with `canvasSnapshot: Json` field

### 9.4 Auto-Explain Flow

1. User advances to stage N (via tick, arrow key, or › button)
2. If `!understood[N]` and `autoExplain=true`: set `explainOpen=true`
3. Explanation card shows with `stage.explain` content
4. On "Got it — start sketching" or Esc: `understood[N]=true`, `explainOpen=false`
5. Camera pans to stage N region regardless of explain state

### 9.5 Keyboard Navigation

| Key | Action |
|---|---|
| `→` / `ArrowRight` | Advance to next stage |
| `←` / `ArrowLeft` | Go to previous stage |
| `Esc` | Close explanation card |
| `Space` | Toggle timer pause (when not in editable area) |

---

## 10. Seniority System

Affects suggestions in guide rail and step explanation card for stage 1 (FR).

| Seniority | FR Suggestions source |
|---|---|
| Beginner | `fr.beginner` (surface-level, user-action framing) |
| Mid-level | `fr.midLevel` (balanced, includes some system concerns) |
| Senior | `fr.senior` (technical framing, includes stretch items) |

The seniority picker appears:
1. On the step explanation card when entering stage 1
2. In the guide rail footer (cycle button `{seniority} ↻`)

Seniority persists in `localStorage` per user.

---

## 11. Feature Flag

V2 is behind the `problemFlowV2` feature flag in the existing feature-flags system.

```typescript
// In canAccessFeature checks:
const v2Enabled = await canAccessFeature(userId, 'problemFlowV2');
if (v2Enabled) {
  return <CanvasSessionUI problem={problem} ... />;
} else {
  return <PracticeUI problem={problem} ... />;  // existing V1
}
```

The flag defaults to `false`. Enable it per-user via admin panel.

---

## 12. What Stays Unchanged from V1

- Auth and access control (`canAccessProblem`, `canAccessFeature`)
- Timer (`TimerWidget` still used, just positioned differently)
- Problem progress tracking (`ProblemProgress`, `startPracticeSession`, `togglePracticeTimer`)
- AI evaluation (repurposed for "Read my canvas")
- Interview mode (can still be triggered alongside canvas)
- Session persistence (extended, not replaced)
- Export PDF (still available from a menu)
- Mobile layout (falls back to V1 on screens < 768px)

---

## 13. Implementation Constraints

1. **No full rewrite.** The canvas UI is a new component tree rooted at `CanvasSessionUI`. The existing `PracticeUI` must remain untouched.
2. **Progressive enhancement.** V2 regions that have existing widgets (`widgetId`) must still render those widgets — embedded in the canvas region, not in a sidebar.
3. **TypeScript strict.** All new files must pass `tsc --noEmit`.
4. **No new dependencies unless justified.** The Excalidraw-style tool strip is cosmetic (no actual drawing library needed for MVP). Free-draw can use a simple `<canvas>` overlay.
5. **Accessibility.** Keyboard navigation (↑↓←→, Tab, Enter, Esc) must work. ARIA labels on all interactive elements.
6. **Performance.** The 3200×1700 virtual canvas uses CSS `transform` (not DOM repositioning). No layout thrashing on stage advance. Canvas content renders via `display:none` (not unmounting) for non-active stages to preserve user edits.

---

## 14. Files to Create / Modify

### New files:
```
src/features/problem-flow-v2/
  CanvasSessionUI.tsx          — root component
  CanvasArea.tsx               — infinite canvas + regions
  GuideRail.tsx                — right panel
  StepExplainCard.tsx          — modal overlay
  BottomDock.tsx               — navigation + ticks
  TopBar.tsx                   — breadcrumb + tool strip + timer
  regions/
    ProblemCard.tsx
    FRRegion.tsx
    NFRRegion.tsx
    EntitiesRegion.tsx
    APIRegion.tsx
    HLDRegion.tsx
    DeepDivesRegion.tsx
  hooks/
    useCanvasSession.ts        — state management
    useCamera.ts               — camera transform calculation
    useCanvasContent.ts        — editable content + persistence
  data/
    canvas-data.ts             — ProblemCanvasData for all problems
    canvas-types.ts            — TypeScript interfaces
  index.ts                     — re-exports

src/app/practice/[slug]/
  page.tsx                     — ADD v2 feature flag branch (no other changes)
```

### Modified files:
```
src/lib/feature-flags.ts       — ADD 'problemFlowV2' feature flag
prisma/schema.prisma           — ADD canvasSnapshot Json field to ProblemProgress
src/app/api/practice/          — ADD canvas-progress route
```

---

*End of Specification. This is the authoritative document. Any ambiguity is resolved by referencing the canvas prototype HTML in `# Ultimate SD Canvas Redesign/Canvas Session.dc.html`.*
