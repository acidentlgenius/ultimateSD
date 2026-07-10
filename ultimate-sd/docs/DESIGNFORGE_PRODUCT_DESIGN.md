# DesignForge — Product Vision & Experience Design

> **Status:** Concept / redesign proposal  
> **Builds on:** SysDesignAI (`ultimate-sd`) Excalidraw integration, AI evaluation stack, problem catalog  
> **Authoring date:** July 2026

---

## Executive Summary

**DesignForge** reimagines system design practice as a single, infinite canvas where thinking, structuring, and drawing are one continuous act — not a sequence of HTML forms interrupted by occasional diagrams. Every requirement, entity, API endpoint, and architecture box lives in structured frames on the canvas. AI coaching reads the canvas contextually. Progress feels like a journey map, not a checklist.

The product thesis: **the best system design interview prep tool is the one that trains you to think spatially and structurally**, the way senior engineers actually whiteboard — with progressive scaffolding, not fragmented UI.

---

## 1. Product Vision & Naming

### 1.1 Vision Statement

> *Master system design by building real architectures on one canvas — guided, scored, and celebrated like a craft.*

DesignForge is an immersive, canvas-first learning platform where users progress through the full system design lifecycle (requirements → NFRs → data model → APIs → HLD → deep dives) on a unified Excalidraw surface. Smart frames appear as the journey unfolds. An AI Coach reviews work in context without spoiling solutions. Seniority-aware depth ensures beginners aren't overwhelmed and seniors aren't bored.

### 1.2 Name Recommendations

| Name | Rationale | Domain feel |
|------|-----------|-------------|
| **DesignForge** *(working title)* | Implies craftsmanship, heat, iteration — "forging" architectures | Strong, memorable |
| **Blueprint** | Universal metaphor for system design; calm, professional | May conflict with existing products |
| **Archboard** | Architecture + whiteboard; describes the core interaction | Descriptive, slightly technical |
| **Canvascraft** | Canvas-first + craft; playful Duolingo energy | Friendly, educational |
| **Schematic** | Engineering precision; short, elegant | Premium, minimal |
| **Loomboard** | Weaving systems together on a board | Poetic, distinctive |
| **Systems Studio** | Professional studio metaphor; Figma-adjacent | Enterprise-friendly |

**Recommendation:** **Schematic** for consumer brand (elegant, ownable) with tagline *"Design systems on one canvas."* Keep **DesignForge** as internal codename if Schematic domains are taken.

**Product naming hierarchy:**
- **Schematic** — consumer brand
- **Schematic Studio** — pro tier with templates, gallery, analytics
- **Schematic Coach** — AI coaching subsystem (marketable feature name)

### 1.3 Positioning vs. Current SysDesignAI

| Dimension | SysDesignAI (today) | DesignForge (vision) |
|-----------|----------------------|----------------------|
| Primary surface | Form inputs + separate diagram panel | Single infinite canvas |
| Step UX | Sidebar list + textarea/list/schema forms | Progressive frames on canvas |
| Diagram role | 2 of ~10 steps | Entire journey is spatial |
| AI help | Floating chat widget | Contextual Coach reading canvas selection |
| Onboarding | Modal + tour | Immersion screen + seniority calibration |
| Feel | Productivity app | Creative tool + learning game |

### 1.4 Design Principles

1. **Canvas is the document** — No orphan forms. If it's user input, it's on the canvas.
2. **Progressive disclosure** — Frames appear when needed; advanced steps unlock by seniority/problem.
3. **Coach, don't solve** — AI suggests, critiques, compares — never pastes a complete answer.
4. **Spatial memory** — Color-coded frames, fixed positions, journey map = spatial anchors for recall.
5. **Delight in progress** — Micro-celebrations, streaks, skill heatmaps — Duolingo energy without childishness.
6. **Interview realism** — Timer mode, probing, verbal practice — same canvas, stricter rules.

---

## 2. Information Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GLOBAL NAV (minimal)                                                    │
│  [Logo]  Problems  My Work  Gallery  Progress  [Profile]                │
└─────────────────────────────────────────────────────────────────────────┘

PRIMARY FLOWS
├── Discover → Problem Library → Problem Immersion → Canvas Session
├── Resume → My Work → In-progress canvas
├── Learn → Guided tracks (roadmap reframed as "Paths")
├── Practice → Interview Simulation (timer canvas mode)
└── Reflect → Progress dashboard + skill heatmap

CANVAS SESSION (full viewport)
├── Left: Journey Map (collapsible)
├── Center: Infinite Excalidraw canvas with smart frames
├── Right: Step Guidance panel (collapsible)
└── Bottom-right: AI Coach (expandable)
```

---

## 3. Detailed User Flows (Text-Based Screen Descriptions)

### 3.1 Flow A — First Visit → First Problem

#### Screen A1: Landing (Guest)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Schematic logo]                              [Sign in]  [Start free]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     Design systems on                                                    │
│     one canvas.                    [Animated canvas preview: frames       │
│                                    appearing sequentially — FR → HLD]    │
│     Guided. Scored.                                                        │
│     Like a real interview.                                               │
│                                                                          │
│     [Explore problems]    [Try live demo — no account]                   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────   │
│  "Trusted patterns from YouTube, Uber, WhatsApp..."  [company logos]     │
│                                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                                     │
│  │ Canvas  │ │ AI      │ │ Progress│   feature cards with subtle motion  │
│  │ first   │ │ Coach   │ │ paths   │                                     │
│  └─────────┘ └─────────┘ └─────────┘                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**UX notes:** Hero shows a looping 15s animation of a canvas session — frames sliding in, user drawing boxes, Coach bubble appearing. No wall of text. CTA "Try live demo" opens TinyURL in read-only demo mode (watermarked, no save).

---

#### Screen A2: Problem Library

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Problems                                                    [Search 🔍] │
├──────────────────────────────────────────────────────────────────────────┤
│  [All] [Basics] [Core Services] [Advanced] [ML]     Difficulty: [▼]     │
│  [Google] [Meta] [Amazon] [Startup]  ← company filter chips              │
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐│
│  │ 🎬 Design YouTube  │  │ 🐦 Design Twitter  │  │ 🚗 Design Uber     ││
│  │ Medium · 45-60 min │  │ Medium · 45-60 min │  │ Hard · 60-75 min   ││
│  │ ████░░░░ 40%       │  │ Not started        │  │ 🔒 Pro             ││
│  │ [Resume]           │  │ [Start]            │  │                    ││
│  └────────────────────┘  └────────────────────┘  └────────────────────┘│
│                                                                          │
│  Cards show: thumbnail (mini canvas preview), difficulty pill, est. time, │
│  progress bar if in-progress, lock icon for paid.                         │
└──────────────────────────────────────────────────────────────────────────┘
```

**UX notes:** Each card's thumbnail is a blurred snapshot of the *reference frame layout* for that problem — visual consistency cue. Hover lifts card (`glass-card` pattern from existing design system).

---

#### Screen A3: Problem Immersion (Entry Point) — **Key Innovation**

Full-screen, cinematic entry before canvas. Replaces jumping straight into practice forms.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to problems                              [Seniority: Intermediate ▼]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │  🎬  DESIGN YOUTUBE                                                ││
│  │  ────────────────────────────────────────────────────────────────  ││
│  │  One-liner: "Build a platform where billions watch and upload       ││
│  │  video with sub-second playback start worldwide."                    ││
│  │                                                                    ││
│  │  THE CHALLENGE                                                     ││
│  │  YouTube serves 2B+ logged-in users, 500 hours of video uploaded    ││
│  │  every minute, and must start playback in <2s globally. A viral    ││
│  │  video can spike to 1M concurrent viewers on a single asset.       ││
│  │                                                                    ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              ││
│  │  │ 2B+ users    │ │ 500 hrs/min  │ │ <2s playback   │  stat pills  ││
│  │  │ scale        │ │ upload       │ │ p95 latency    │              ││
│  │  └──────────────┘ └──────────────┘ └──────────────┘              ││
│  │                                                                    ││
│  │  WHAT GOOD LOOKS LIKE                                              ││
│  │  ✓ Clear separation of upload, transcode, storage, CDN, playback    ││
│  │  ✓ Quantified NFRs tied to real YouTube-scale numbers              ││
│  │  ✓ Thoughtful trade-offs on consistency vs. availability for views  ││
│  │                                                                    ││
│  │  Asked at: Google · Meta · Amazon · Netflix                        ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────┐                                        │
│  │ 💬 Ask a clarifying question │  ← expands to chat strip at bottom   │
│  │ "Is live streaming in scope?"│                                        │
│  └─────────────────────────────┘                                        │
│                                                                          │
│              [ Start Designing → ]   large, gradient, pulse on hover       │
│              Est. 45-60 min · 6 canvas sections                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Transition animation:** On "Start Designing", immersion content fades up and scales down; canvas zooms in from center (Framer Motion). First frame (Functional Requirements) materializes with a soft `animate-fade-in` and focus ring.

**AI clarifying questions:** Lightweight chat strip — not full Coach. Answers scope boundaries ("Live streaming is out of scope for this session") without design hints.

---

#### Screen A4: Seniority Calibration (first session or profile)

Modal overlay on first "Start Designing" — skippable but encouraged.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    How deep should we go?                                │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│   │  Beginner   │  │ Intermediate│  │  Advanced   │  │ Senior /    │  │
│   │  🌱         │  │  🌿         │  │  🌳         │  │ Architect 🏛 │  │
│   │  3 FRs      │  │  5 FRs      │  │  7+ FRs     │  │  Open-ended │  │
│   │  Heavy      │  │  Balanced   │  │  Light      │  │  Minimal    │  │
│   │  guidance   │  │  guidance   │  │  prompts    │  │  scaffolding│  │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                          │
│   You can change this anytime from the Journey Map.                      │
│                              [Continue →]                                │
└──────────────────────────────────────────────────────────────────────────┘
```

**Seniority effects (system behavior):**

| Level | FR starter count | NFR sliders shown | Advanced steps | Coach verbosity | Pass threshold |
|-------|------------------|-------------------|----------------|-----------------|----------------|
| Beginner | 3 pre-filled | Templates with examples | Hidden until unlocked | High | Slightly lenient |
| Intermediate | 4-5 pre-filled | Full template | All standard steps | Medium | Standard |
| Advanced | 2 seeds only | Blank + checklist | + Bottlenecks | Low | Standard |
| Senior+ | 0-1 seed | Blank | + Cost, security, ops | Minimal | Stricter |
| Architect | 0 | Blank | User adds custom frames | Socratic only | Strictest |

---

### 3.2 Flow B — Unified Canvas Session (Core Experience)

#### Screen B1: Canvas Layout — Default State

```
┌──────┬───────────────────────────────────────────────────────────┬──────────┐
│JOURNEY│                                                          │ GUIDANCE │
│ MAP  │              INFINITE EXCALIDRAW CANVAS                   │  PANEL   │
│      │                                                          │          │
│ ○ FR │   ┌─ FRAME 1: Functional Requirements ───────────────┐  │ Step 1   │
│ ● NFR│   │ ▌ Priority │ Requirement                          │  │ ──────── │
│ ○ ER │   │  P0        │ Upload video up to 12 hours          │  │ ⏱ 10-15m │
│ ○ API│   │  P0        │ Stream with adaptive bitrate         │  │          │
│ ○ HLD│   │  P1        │ Search videos by title/tags          │  │ Objectives│
│ ○ ...│   │  [+ Add requirement]                               │  │ • Identify│
│      │   │                                                    │  │   core   │
│ 42%  │   └────────────────────────────────────────────────────┘  │   user   │
│ ──── │                                                          │   actions│
│ 28m  │   (dimmed ghost outlines of future frames below)         │          │
│ left │                                                          │ Pitfalls │
│      │                                                          │ • Don't  │
│[◀]   │                                                          │   jump to│
│      │                                                          │   APIs   │
├──────┴───────────────────────────────────────────────────────────┴──────────┤
│  [Coach 💬]  "Select any element and ask me about it"          [Export ▼] │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Left — Journey Map:**
- Vertical step pills with completion ring (Duolingo-style)
- Overall % and estimated time remaining
- Collapsible to icon rail (`◀` → 48px wide)
- Click any step → canvas pans/zooms to that frame
- Seniority badge at bottom

**Center — Canvas:**
- Single Excalidraw instance for entire session (not per-step remount)
- Frames are Excalidraw **grouped rectangles** with locked headers + embedded text/table elements
- Future frames visible as 15% opacity "ghost" outlines — spatial preview of journey
- Active frame has colored left border (FR=blue, NFR=purple, ER=green, API=orange, HLD=red)

**Right — Guidance Panel:**
- Step title, ideal time range, learning objectives
- Key considerations (bullets)
- Common pitfalls
- "Mark step complete" CTA (triggers AI review)
- Collapsible

**Bottom — Coach strip:**
- Collapsed: single line prompt
- Expanded: 360px panel slides up (not a modal — canvas stays visible)

---

#### Screen B2: Step 1 — Functional Requirements (Canvas Detail)

```
┌─ FRAME: Functional Requirements ─────────────────────────────────────────┐
│  STEP 1 OF 6 · Blue theme · ⏱ 10-15 min ideal                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Starter requirements (editable) ──────────────────────────────────┐  │
│  │  P0  │ Users can upload video files up to 12 hours                 │  │
│  │  P0  │ Users can watch videos with adaptive bitrate streaming      │  │
│  │  P1  │ Users can search videos by title, description, and tags     │  │
│  │  [+] Add requirement                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Sticky notes area — user can drag MoSCoW notes, edge cases]           │
│                                                                          │
│  Toolbar (frame-local):  [AI Suggest FRs]  [Prioritize]  [Polish text]  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Interaction model:**
- Requirements are Excalidraw **text elements** inside a grouped frame, or a custom **embedded table** element (see §5)
- Priority column: dropdown rendered as small badge shapes (P0/P1/P2)
- "AI Suggest FRs" adds ghost text items user can accept/reject (like GitHub Copilot inline)
- No HTML `<textarea>` anywhere

**Completion:** User clicks "Review this step" in Guidance panel → Coach evaluates canvas content in frame bounds → score 1-5 + feedback overlay appears as **canvas annotations** (comment pins, not modal)

---

#### Screen B3: Step 2 — Non-Functional Requirements

```
┌─ FRAME: Non-Functional Requirements ─────────────────────────────────────┐
│  STEP 2 OF 6 · Purple theme                                              │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─ Intro card (collapsible) ─────────────────────────────────────────┐  │
│  │  NFRs define HOW WELL the system performs. Examples:               │  │
│  │  • Scale: 2B users, 1M concurrent on viral video                   │  │
│  │  • Latency: p99 playback start < 2s                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ NFR Table ────────────────────────────────────────────────────────┐  │
│  │ Category    │ Target              │ Priority │ Notes               │  │
│  │─────────────│─────────────────────│──────────│─────────────────────│  │
│  │ Scale       │ [1M concurrent/vid] │ P0       │ viral spike         │  │
│  │ Availability│ [99.99%]            │ P0       │ [slider visual]     │  │
│  │ Latency     │ [p99 < 200ms]       │ P0       │ playback start      │  │
│  │ Consistency │ [Eventual for views]│ P1       │                     │  │
│  │ Cost        │ [$0.01/GB/month]    │ P2       │                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Quantitative sliders:** Custom canvas widget elements — dragging a handle updates text in place (e.g., uptime 99.9% → 99.99%). Implemented as Excalidraw custom elements or overlaid React portals anchored to element bounds.

---

#### Screen B4: Step 3 — Core Entities & Data Model

```
┌─ FRAME: Data Model ──────────────────────────────────────────────────────┐
│  STEP 3 OF 6 · Green theme                                               │
├──────────────────────────────────────────────────────────────────────────┤
│  View: [Simple boxes ▼]  [DB schema]  [ER diagram]                       │
│                                                                          │
│     ┌──────────┐       uploads        ┌──────────┐                       │
│     │   User   │─────────────────────▶│  Video   │                       │
│     │──────────│       1:N            │──────────│                       │
│     │ id       │                      │ id       │                       │
│     │ email    │                      │ title    │                       │
│     └──────────┘                      │ status   │                       │
│                                       └────┬─────┘                       │
│                                            │ 1:N                          │
│                                            ▼                              │
│                                       ┌──────────┐                       │
│                                       │  Chunk   │                       │
│                                       └──────────┘                       │
│                                                                          │
│  [+ Entity from template]  [Auto-layout]  [AI critique model]            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Templates:** Library panel (slide-over) with entity templates — User, Video, Comment, etc. Drag onto canvas creates grouped box with field rows.

**View modes:** Toggle re-renders same data — boxes for beginners, crow's-foot ER for intermediate, SQL DDL text for advanced.

---

#### Screen B5: Step 4 — API Design

```
┌─ FRAME: API Design ────────────────────────────────────────────────────────┐
│  STEP 4 OF 6 · Orange theme                                              │
├──────────────────────────────────────────────────────────────────────────┤
│  Protocol: [REST ●] [gRPC] [GraphQL]                                     │
│                                                                          │
│  ┌─ POST /v1/videos ─────────────────────────────────────────────────┐ │
│  │ Auth: OAuth 2.0 · Rate limit: 100 req/min/user                    │ │
│  │ Request:  { title, description, file_hash }                        │ │
│  │ Response: { video_id, upload_url, status }                         │ │
│  │ Errors:   400, 401, 413, 429                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─ GET /v1/videos/{id}/stream ──────────────────────────────────────┐ │
│  │ ...                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [+ Endpoint]  [Generate OpenAPI visual]  [AI review API surface]        │
└──────────────────────────────────────────────────────────────────────────┘
```

**OpenAPI visual:** Auto-layout of endpoint cards with connection lines to shared schemas (like Swagger UI but on canvas).

---

#### Screen B6: Step 5 — High-Level Design (Hero Frame)

```
┌─ FRAME: High-Level Architecture ───────────────────────────────────────────┐
│  STEP 5 OF 6 · Red theme · Largest frame — 80% viewport when focused      │
├──────────────────────────────────────────────────────────────────────────┤
│  Patterns: [Microservices] [Event-driven] [CQRS] [Lambda] ← stamp presets │
│                                                                          │
│         ┌─────────┐     ┌──────────────┐     ┌─────────┐                │
│         │   CDN   │────▶│ API Gateway  │────▶│ Upload  │                │
│         └─────────┘     └──────┬───────┘     │ Service │                │
│                                │             └────┬────┘                │
│                                ▼                  │                      │
│                         ┌──────────────┐         ▼                      │
│                         │ Transcode    │    ┌─────────┐                │
│                         │ Queue        │    │ Object  │                │
│                         └──────────────┘    │ Storage │                │
│                                             └─────────┘                │
│                                                                          │
│  Full Excalidraw tools: shapes, arrows, layers, grouping, libraries       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Pattern stamps:** Clicking "Event-driven" drops a pre-grouped template (queue, workers, event bus) user modifies — accelerates without solving.

---

#### Screen B7: Step 6+ — Advanced (Contextual)

Appears based on problem tags + seniority:

| Advanced frame | When shown | Content |
|----------------|------------|---------|
| Bottlenecks & Scaling | Medium+ problems | Load paths, single points of failure |
| Trade-offs | Always (Senior: first) | CAP, SQL/NoSQL, push/pull CDN |
| Deep Dive: Caching | Cache-heavy problems | CDN, Redis layers, invalidation |
| Deep Dive: Sharding | Write-scale problems | Shard keys, hotspots |
| Observability | Senior+ | Metrics, traces, alerts |
| Security | Auth/payment problems | Threat model frame |
| Cost Estimation | Architect level | Back-of-envelope calculator frame |

---

#### Screen B8: Step Completion & AI Review

When user marks step complete:

```
┌─ Canvas overlay (not modal) ─────────────────────────────────────────────┐
│                                                                          │
│   ┌─ Review: Functional Requirements ─────────────────────────────────┐  │
│   │  ★★★★☆  4/5                                                      │  │
│   │                                                                    │  │
│   │  ✓ Strong coverage of upload and playback                          │  │
│   │  ✓ Good prioritization with P0/P1                                  │  │
│   │  △ Missing: monetization / ads (optional but often discussed)     │  │
│   │  △ Consider live streaming scope boundary                         │  │
│   │                                                                    │  │
│   │  [Ask Coach]  [Revise on canvas]  [Continue to NFRs →]             │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Feedback pins appear on specific canvas elements (like Figma comments)    │
└──────────────────────────────────────────────────────────────────────────┘
```

**No modal blocking canvas** — review card is a floating frame anchored to the step, dismissible.

---

#### Screen B9: Session Complete

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         🎉 Architecture complete                          │
│                                                                          │
│   Overall score: 4.2 / 5    Time: 52 min    Steps: 6/6                  │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  [Thumbnail of full canvas zoomed out]                          │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Skill updates:  +API Design  +Video Systems  +Scaling                  │
│                                                                          │
│   [Compare to reference solution]  [Export PDF]  [Share link]            │
│   [Interview simulation with this design]  [Next problem →]            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Flow C — AI Coach Interactions

#### Coach States

**Collapsed (default):**
```
│ 💬 Coach — Select anything on the canvas to get feedback     [Expand] │
```

**Expanded with selection:**
```
┌─ Coach ──────────────────────────────────────────────────────────────────┐
│ You selected: "POST /v1/videos" endpoint card                            │
│                                                                          │
│ 🤖 This is a solid upload initiation pattern. A few questions:           │
│    • How does the client resume a failed upload?                         │
│    • Why POST instead of multipart direct to storage?                    │
│                                                                          │
│ [Compare to YouTube's resumable upload approach]  ← optional deep link   │
│                                                                          │
│ [Type a question...]                                      [Send]        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Coach context payload (to API):**
- Problem metadata + seniority
- Current step frame ID
- Selected element IDs + extracted text content
- Full frame text (bounded token budget)
- Prior step scores
- Never: reference solution text (unless compare mode)

---

### 3.4 Flow D — Interview Simulation Mode

Same canvas — rule changes:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🔴 INTERVIEW MODE · 42:15 remaining · Design YouTube                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Journey Map: condensed to 3 phases (Clarify · Design · Trade-offs)      │
│  Coach: DISABLED                                                         │
│  Guidance panel: minimal prompts only                                    │
│  Probing: random Skeptic questions appear as canvas comment pins         │
│                                                                          │
│  [End interview early]                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

End state: hiring-committee debrief + optional voice replay (build on existing voice interview stack).

---

### 3.5 Flow E — Solution Comparison Mode

Split canvas view:

```
┌────────────────────────────┬────────────────────────────┐
│  YOUR DESIGN               │  REFERENCE (blurred sections)│
│  (full color)              │  (reveal per-step after     │
│                            │   attempt or Pro unlock)    │
├────────────────────────────┴────────────────────────────┤
│  Diff highlights: ✓ You covered CDN  △ Different sharding  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Key UX Innovations

### 4.1 Canvas-Native Forms (Paradigm Shift)

**Problem today:** SysDesignAI uses `textarea`, `list` inputs, and `SchemaBuilder` — the diagram is secondary.

**DesignForge:** Custom **Frame Elements** — grouped Excalidraw containers with:
- Locked header bar (step title, color, progress)
- Embedded structured content (tables, entity boxes, API cards)
- Editable text children
- Metadata JSON in element `customData` field

This is the single most important technical/UX investment.

### 4.2 Spatial Journey Memory

Future steps appear as ghost frames below the active step. Users always see the "shape" of the full interview. Reduces anxiety ("what's coming?") and mirrors real whiteboard interviews where interviewer outlines phases upfront.

### 4.3 Feedback as Canvas Annotations

Instead of `FeedbackModal` blocking the UI, scores appear as **comment pins** on the elements Coach critiqued — Figma-style. Persistent until resolved. Builds spatial association between mistake and location.

### 4.4 Seniority as a Live Dial

Not just onboarding — a dial in Journey Map recalibrates:
- Ghost frame visibility
- Starter content density
- Coach verbosity
- Evaluation strictness

Changing mid-session offers: "Regenerate starters for new level?" (never overwrites user work without consent).

### 4.5 AI Inline Suggestions (Ghost Elements)

Coach suggestions appear as 40% opacity elements. Tab to accept, swipe/Delete to dismiss. Like Copilot for architecture — preserves user agency.

### 4.6 Pattern Stamp Library

Pre-built architecture patterns (microservices, lambda, event sourcing) draggable from library — teaches patterns by construction, not reading.

### 4.7 Version Snapshots Per Step

Timeline scrubber in Journey Map: "Your HLD at 32 min" vs "now". Builds confidence and supports interview replay. Stored as incremental Excalidraw scene diffs.

### 4.8 Skill Heatmap (Progress Analytics)

```
        Caching  Sharding  APIs  Queues  CAP
Video     ████     ██      ████   ███    ██
Social    ███      ████    ███    ██     ████
Infra     ██       ████    ██     ████   ███
```

Updates after each session based on problem tags + step scores.

### 4.9 Community Gallery (Anonymized)

Opt-in publish of canvas snapshots. Browse "Top YouTube designs this week." Social proof + learning from peers without cheating (no scores shown, no copy-paste — view only).

### 4.10 Immersion Screen as Content Marketing

Each problem's immersion screen is shareable (OG image, stats, one-liner). Drives SEO and virality — "Design YouTube on Schematic."

---

## 5. Technical Implementation Notes

### 5.1 Build on Existing `ultimate-sd` Foundation

| Existing asset | Reuse strategy |
|----------------|----------------|
| `DiagramCanvas.tsx` | Evolve to `ForgeCanvas.tsx` — single session-scoped instance |
| `diagram-persistence.ts` | Extend to full-session key + per-step snapshots |
| `DiagramCanvasContext` | Expand handle: `getFrameContent()`, `focusFrame()` |
| `problem-steps.ts` | Map steps → frame templates + positions |
| `solutions.ts` | Power comparison mode |
| `langgraph.ts` / evaluate route | Coach + step review agents |
| `access.ts` / `plans.ts` | Unchanged gating model |
| 86 problems + 49 widgets | Widgets become canvas stamp library items |

### 5.2 Excalidraw Extensibility Strategy

#### Phase 1 — Composition (no fork, ship fast)

Use standard Excalidraw elements creatively:

```typescript
// Frame = rectangle (locked) + text children + group
type FrameMetadata = {
  type: 'schematic-frame';
  stepId: 'functional-requirements';
  stepIndex: 0;
  theme: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  collapsed: boolean;
  version: number;
};

// Store in element.customData (Excalidraw supports customData on elements)
```

- **Frames:** `rectangle` with `strokeColor` per step theme, `locked: true` on border
- **Tables:** Grid of `text` elements with computed positions, grouped
- **Entities:** Rounded rectangles + text rows, grouped
- **API cards:** Structured text blocks in monospace font (Geist Mono)

**Scene structure:**
```typescript
type SessionScene = {
  sessionId: string;
  problemSlug: string;
  seniority: SeniorityLevel;
  elements: ExcalidrawElement[];  // ALL steps on one canvas
  frameOrder: string[];           // element IDs in journey order
  activeFrameId: string;
  snapshots: Record<string, ExcalidrawScene>; // stepId → point-in-time
};
```

**Persistence migration:**
- Today: `diagram-{stepKey}` per step in localStorage
- DesignForge: `forge-session-{sessionId}` single blob + `forge-snapshots-{sessionId}`

#### Phase 2 — Custom Elements (medium effort, high payoff)

Register Excalidraw custom element types via plugin API (if available in bundled version) or overlay React portals:

| Custom element | Implementation |
|----------------|----------------|
| `schematic-table` | Portal overlay synced to element bounds; edit cells |
| `schematic-slider` | Drag handle updates bound text |
| `schematic-entity` | Collapsible field list |
| `schematic-api-card` | Method badge + schema blocks |

Fallback: **HTML overlay layer** above Excalidraw canvas, positioned via `element.x/y/width/height` on scroll/zoom — similar to Miro embeds.

#### Phase 3 — Excalidraw Fork / PR Upstream

If custom elements need first-class support:
- Contribute `customData` schema spec upstream
- Or maintain `@schematic/excalidraw` fork with `FrameElement` type

### 5.3 Canvas Orchestration Architecture

```
ForgeCanvasProvider
├── ForgeCanvas (single Excalidraw instance)
├── FrameManager
│   ├── spawnFrame(stepId, seniority) → elements[]
│   ├── focusFrame(stepId) → scrollToContent + highlight
│   ├── collapseFrame / expandFrame
│   └── extractFrameText(stepId) → string for AI
├── SnapshotManager
│   ├── saveSnapshot(stepId)
│   └── restoreSnapshot(stepId, timestamp)
├── CoachBridge
│   ├── getSelectionContext() → selected element texts
│   └── applyGhostSuggestions(elements[])
└── ExportManager
    ├── exportPDF (per-frame pages)
    ├── exportPNG (full or per-frame)
    └── exportShareLink (read-only scene URL)
```

**Key invariant from current codebase:** Never persist empty scene before hydration (`hasHydratedRef` pattern from `DiagramCanvas.tsx`). Critical when frames span one long session.

### 5.4 AI Pipeline Changes

| Agent | Input change | Output change |
|-------|--------------|---------------|
| Step Review | `extractFrameText(frameId)` + problem context | Score 1-5 + `annotations: { elementId, comment }[]` |
| Coach | Selection + frame text + seniority | Markdown → canvas ghost elements optional |
| Compare | User frame vs reference solution section | Diff highlights, not full reveal |
| Interview Skeptic | Full canvas text at checkpoints | Canvas comment pins |

**Evaluation mapping:** Existing `resolveEvaluationSubStepKey` maps to frame IDs:
- `functional` → `functional-requirements` frame
- `api` → `api-design` frame
- `architecture` → `hld` frame

### 5.5 Frame Template System

```typescript
// src/lib/forge/frame-templates.ts
type FrameTemplate = {
  stepId: string;
  title: string;
  theme: FrameTheme;
  idealMinutes: [number, number];
  objectives: string[];
  pitfalls: string[];
  spawn: (ctx: { problem: SystemDesignProblem; seniority: SeniorityLevel }) => ExcalidrawElement[];
};

// Problem-specific overrides in forge/problem-frames.ts
```

Templates generate initial elements with positions calculated for vertical flow (each frame ~800px below previous).

### 5.6 Navigation: Canvas Pan vs Step Focus

```typescript
function focusFrame(api: ExcalidrawImperativeAPI, frameId: string) {
  const frame = getElement(frameId);
  api.scrollToContent([frame], { animate: true, fitToViewport: true });
  api.setAppState({ selectedElementIds: { [frameId]: true } });
  // Dim non-active frames via opacity customData
}
```

### 5.7 Performance

- **86 problems × 6 frames × ~50 elements** = manageable single scene (<500 elements typical)
- Lazy-render ghost frames: only header until user scrolls near
- Debounced save (existing 1000ms pattern)
- Server: store compressed scene JSON in `PracticeSession.diagramSnapshot` (already Json column)

### 5.8 Mobile Strategy

Canvas-first is hard on mobile. Pragmatic approach:
- **Tablet+:** Full experience
- **Phone:** Simplified "companion mode" — Journey Map + Coach + read-only canvas preview; prompt "Continue on desktop for best experience" OR vertical stack frames (one frame per viewport, snap scroll)

### 5.9 Migration Path from SysDesignAI

1. **Dual mode flag:** `?canvas=forge` on practice URL
2. Port 3 pilot problems (TinyURL, YouTube, Uber) to frame templates
3. A/B test completion rate vs form-based flow
4. Deprecate `StepByStepChat` form inputs when parity reached

---

## 6. Monetization & Differentiation

### 6.1 Tier Structure (Evolved from Current Plans)

| Tier | Price | Canvas features | AI | Social |
|------|-------|-----------------|-----|--------|
| **Free** | ₹0 | 8 problems, full canvas, 20 credits/mo | Coach + review | View gallery |
| **Pro** | ₹299/mo | All 86 problems, exports, snapshots | BYOK | — |
| **AI+** | ₹699/mo | Everything + comparison mode | 500 credits | Publish to gallery |
| **Studio** | ₹1499/mo | Custom templates, team seats, analytics | Unlimited credits | Team workspace |
| **Lifetime** | ₹1999 | Pro forever | BYOK | — |

### 6.2 Differentiation Moat

| Competitor angle | DesignForge advantage |
|------------------|----------------------|
| Educative / Udemy | Active practice, not passive video |
| Interviewing.io | Always available, structured curriculum, canvas artifacts |
| Excalidraw alone | Guided journey + AI scoring + problem library |
| SysDesignAI today | Canvas-first = 10x more interview-realistic |
| LeetCode | Systems focus, spatial thinking, senior-level depth |

### 6.3 Premium Upsell Moments

- **Comparison mode** after completion ("See how Netflix engineers think about this")
- **Interview simulation** on completed canvas
- **Export to Notion/Confluence** with formatted frames
- **Custom problem** canvas sessions (existing `/custom` flow, canvas-native)
- **Team dashboards** for bootcamps (Studio tier)

### 6.4 Growth Loops

1. **Shareable immersion screens** → SEO ("design youtube system interview")
2. **Shareable canvas links** → viral ("my YouTube architecture")
3. **Gallery** → browsable → signup
4. **Skill heatmap** → LinkedIn share card ("Top 15% in caching")
5. **Streaks** → daily return (Duolingo loop)

### 6.5 B2B Opportunity

- **Schematic for Teams:** Bootcamps (Scaler, AlgoExpert-style), university CS programs
- Admin assigns problems, views cohort heatmaps
- Replaces physical whiteboard practice in system design courses

---

## 7. Aesthetic Direction

### 7.1 Visual Language

**Tone:** Calm confidence — "you're in a professional studio, not a classroom."

| Token | Value | Usage |
|-------|-------|-------|
| Background | Deep slate (dark) / warm off-white (light) | Canvas surrounds |
| Frame: FR | `#3B82F6` blue | Requirements |
| Frame: NFR | `#8B5CF6` purple | Non-functionals |
| Frame: ER | `#10B981` green | Data model |
| Frame: API | `#F59E0B` amber | APIs |
| Frame: HLD | `#EF4444` red | Architecture |
| Coach bubble | Gradient blue→purple | Existing brand continuity |
| Typography | Geist Sans + Geist Mono | Keep from DESIGN_SYSTEM.md |
| Motion | 200ms ease-out frame focus; 400ms step transitions | Subtle, not playful-excessive |

### 7.2 Micro-interactions

- Frame complete → soft green pulse on Journey Map pill
- Score reveal → stars animate in sequence (not confetti bomb — more professional)
- Ghost suggestion accept → opacity 40%→100% + snap into grid
- Session complete → canvas zoom-out reveal (cinematic)

### 7.3 Copy Tone Examples

| Context | ❌ Avoid | ✅ Prefer |
|---------|---------|----------|
| Empty FR frame | "Enter your requirements below" | "What should this system let users do?" |
| Low score | "Failed" | "Strong start — two areas to sharpen" |
| Coach | "Here's the answer" | "What happens to upload state if the client disconnects?" |
| Timer warning | "Hurry up!" | "8 minutes left — prioritize trade-offs" |

---

## 8. Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Session completion rate | +30% vs form UI | Canvas engagement |
| Avg session duration | 40-55 min | Interview realism |
| D7 retention | 25%+ | Streak + heatmap loop |
| Coach interactions/session | 3+ | AI value perception |
| Free → Pro conversion | 8%+ | Comparison + exports |
| NPS | 50+ | Delight factor |

---

## 9. Implementation Roadmap

### Phase 0 — Foundation (4-6 weeks)
- [ ] `ForgeCanvas` single-scene architecture
- [ ] `FrameManager` + 1 template (Functional Requirements)
- [ ] Journey Map sidebar shell
- [ ] Pilot: Design TinyURL end-to-end

### Phase 1 — Core Journey (6-8 weeks)
- [ ] All 6 standard frame templates
- [ ] Guidance panel + Coach with selection context
- [ ] Step review with canvas annotations
- [ ] Session persistence migration
- [ ] 10 problems ported

### Phase 2 — Polish & Premium (6 weeks)
- [ ] Seniority dial + ghost frames
- [ ] Snapshots + export PDF
- [ ] Comparison mode
- [ ] Interview simulation on canvas
- [ ] Immersion screens for all problems

### Phase 3 — Growth (ongoing)
- [ ] Gallery + share links
- [ ] Skill heatmap
- [ ] Studio tier / teams
- [ ] Custom element overlays (tables, sliders)

---

## 10. Open Questions

1. **Excalidraw license / fork policy** — confirm custom element approach with bundled version
2. **Mobile scope** — ship tablet-first or invest in phone snap-scroll?
3. **Reference solution reveal** — per-step vs end-only in comparison mode?
4. **Collaborative canvas** — future multiplayer for pair practice?
5. **Offline** — PWA with local scene storage?

---

*This document is a living design spec. Next step: interactive prototype of Frame Manager on top of existing `DiagramCanvas.tsx` with TinyURL as pilot.*
