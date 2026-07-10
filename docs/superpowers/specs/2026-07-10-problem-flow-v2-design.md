# Problem Flow V2 — Canvas-First Guided Sessions

> **Status:** Approved (2026-07-10)
> **Spec version:** v1.0
> **Scope:** New problem-solving experience — a single persistent Excalidraw canvas with guided stages — behind the `newProblemFlow` feature flag.
> **Design reference:** `Ultimate_SD_Canvas_Redesign/Canvas Session.dc.html` (design capture) and `Ultimate_SD_Canvas_Redesign/uploads/`

---

## Executive summary

Replace the form-based step flow (`StepByStepChat`) with a canvas-first experience: everything the user writes or draws lives on **one persistent Excalidraw canvas per attempt**, while a guided stage system (right guide rail + bottom stage dock + first-entry explanation cards) provides structure, timing, and AI feedback without forms.

Ships behind the DB-backed `newProblemFlow` feature flag. Flag off → old flow, byte-identical. Flag on → new flow for all problem sessions for that user.

**V1 scope: core only.** Canvas + guided stages, timer, seniority selector, AI feedback (Submit for Review / Read my canvas), progress persistence, completion. Interview Mode, Voice, Practice Aloud, AI Probe, Export PDF, Help Assistant, and the tour are deferred; the flag is enabled only for testers until parity decisions are made.

## Decisions log

| Question | Decision |
|----------|----------|
| Flag mechanism | DB `FeatureFlag` only — add `'newProblemFlow'` to `FEATURE_KEYS`; admin panel + per-user overrides; no env var |
| Persistence | Extend `PracticeSession` with `canvasState` + `flowState` Json columns; localStorage as fast cache |
| V1 parity bar | Core only (see above) |
| Architecture | New vertical module `src/features/problem-flow-v2/`; old flow untouched; branch at the page seam |
| State management | Zustand (new dep) — one cohesive session store |
| AI endpoint | Reuse `/api/ai/evaluate`; canvas→text serializer produces `userAnswer` |

---

## 1. Feature flag

- Add `'newProblemFlow'` to `FEATURE_KEYS` in `src/lib/plans.ts`. Seed default `[]` (dark) in `FEATURE_SEED_DEFAULTS`; `FEATURE_INTENDED_PLANS` = all plans (`free`, `platform`, `lifetime`, `ai`) — this is a UX rollout flag, not a monetization gate.
- `src/app/practice/[slug]/page.tsx` (which already calls `canAccessFeature`) additionally resolves `newProblemFlow` server-side and renders `<ProblemFlowV2>` when enabled, `<PracticeUI>` otherwise. This is the **only** touch point in existing code besides the flag registry.
- Inside the module, `FlowV2Provider` (React context) carries flag metadata and session bootstrap data (problem, steps, resumed session state) to nested client components.
- **Toggling:** seed with `pnpm seed:flags` (dark), then enable via the admin FeatureFlagsPanel — plan-wide or per-user override. Testers use a per-user override on their own account.

## 2. Module layout

```
src/features/problem-flow-v2/
├── ProblemFlowV2.tsx            # client root: FlowV2Provider, store init, layout
├── components/
│   ├── CanvasStage.tsx          # Excalidraw wrapper (persistence, tagging, camera)
│   ├── GuideRail.tsx            # collapsible right rail
│   ├── StageDock.tsx            # bottom prev/next + ticks
│   ├── StageExplanationCard.tsx # first-entry progressive disclosure
│   ├── QuietTimer.tsx           # corner mono timer
│   ├── Breadcrumb.tsx           # top-left problem / stage
│   ├── SenioritySelector.tsx
│   ├── FeedbackNotes.tsx        # rail feedback rendering
│   └── CompletionCard.tsx
├── store/flow-store.ts          # Zustand store
├── lib/
│   ├── stage-journey.ts         # buildStageJourney(phaseSteps, problem)
│   ├── canvas-persistence.ts    # localStorage key canvas-v2-${problemId}
│   ├── element-tagging.ts       # customData.flowStage attribution
│   ├── canvas-serializer.ts     # scene → structured text for AI
│   └── camera.ts                # stage region anchors + scroll choreography
├── types.ts
└── __tests__/
```

First `features/` folder in the repo; whichever flow eventually loses can be deleted cleanly.

**State management: Zustand.** One `useFlowStore` per session holding: stage index, per-stage status (`untouched | active | submitted | passed`), seniority, rail collapsed, explanation-card seen-set, feedback state machine (`idle | loading | done | error`), save-sync status. Chosen over Jotai because this is one cohesive session object with cross-cutting actions (advance stage → move camera → mark status → sync), not independent atoms. The old flow's `window` CustomEvent bus is **not** used in v2.

## 3. Stage model

Seven stages: Problem Understanding → Functional Requirements → Non-Functional Requirements → Core Entities → API Design → High-Level Design → Deep Dives (bottlenecks, trade-offs).

`buildStageJourney(phaseSteps, problem)` adapts the output of the existing `getPracticeSteps(slug, difficulty)` onto these stages, so bespoke per-problem content from `src/lib/problem-steps.ts` feeds each stage's guidance. Missing phases for a problem collapse gracefully (a stage with no source steps is dropped; the dock shows the actual count, not always 7).

```typescript
type FlowStage = {
  id: StageId;                        // 'understanding' | 'fr' | 'nfr' | 'entities' | 'api' | 'hld' | 'deepdive'
  label: string;
  budgetMinutes: number;              // "ideal ≈Xm" — derived from problem difficulty
  explain: string;                    // explanation-card body
  tipsBySeniority: Record<Seniority, string[]>;        // "Focus on"
  suggestionsBySeniority: Record<Seniority, string[]>; // "Worth considering"
  canvasRegion: { x: number; y: number; zoom: number };
  sourceStepKeys: string[];           // mapping back to existing step keys for StepSubmission.stepId
};
type Seniority = 'beginner' | 'mid' | 'senior';
```

Seniority selects the depth tier of tips/suggestions client-side and is appended to the AI evaluation context. Default `mid`; chosen in the first explanation card; changeable anytime from the rail chip; persisted in `flowState` and mirrored to localStorage as the default for future sessions.

## 4. Canvas

One Excalidraw instance per session: new `CanvasStage` component wrapping `@excalidraw/excalidraw` directly. The existing `DiagramCanvas` stays untouched — its per-step-key persistence contradicts one-scene-per-session. `CanvasStage` reuses proven helpers from `src/lib/diagram-persistence.ts` (`stripFilesForPersistence`, 1 s debounce, hydration guards) with key `canvas-v2-${problemId}`.

- **Element→stage attribution:** while stage N is active, newly created elements (detected by diffing element ids in `onChange`) receive `customData: { flowStage: <StageId> }`. This lets stage-scoped evaluation coexist with one shared canvas. Elements edited later keep their original stage tag.
- **Camera choreography:** each stage has a home region (layout anchors mirroring the design capture: problem card far left, FR/NFR mid-left, entities/API mid-right, HLD right, deep dives far right). Stage change animates scroll/zoom to that region (`scrollToContent` / `updateScene` scroll). The user can always pan/zoom freely — navigation never locks the camera.
- **Region seeding:** on first entry to a stage, a locked section-header text element (e.g. "Functional requirements") is seeded at the region anchor so the canvas self-structures without forms.
- **Problem card:** the problem statement is seeded as a locked frame on the canvas for stage 1 and is always available in the guide rail/breadcrumb afterwards.
- **Embedded images:** same v1 limitation as the existing canvas — `files` stripped from persistence, session-only.

## 5. Persistence

**Prisma migration** — two nullable Json columns on `PracticeSession`:

- `canvasState Json?` — full Excalidraw scene, files stripped (`trimSceneForDbSnapshot`-style trimming).
- `flowState Json?` — `{ version: 2, currentStage, stageStatuses, seniority, explanationSeen }`.

No new models. Existing session lifecycle is reused as-is: `startPracticeSession`, `togglePracticeTimer` (timer fields), `completeSession`, attempt numbering, `ProblemProgress` rollups.

**Write path:**
- localStorage is the fast cache (1 s debounce, existing pattern).
- New server action `syncFlowV2Session(sessionId, canvasState, flowState)` pushes to DB on: stage transitions, every submit, and a 30 s idle debounce. Failures are non-blocking — retry with backoff, subtle "saved locally" indicator; "Saved to account" when synced.
- **Resume:** page loader prefers DB state when it is newer than localStorage (timestamp comparison), enabling cross-device resume.

**AI feedback records:** reuse `recordStepSubmission` unchanged. Each stage submission writes a `StepSubmission` with the serialized canvas text as `content` and `stepId` from `sourceStepKeys[0]`, keeping history, progress percent, and XP semantics consistent with old-flow data.

**Completion:** finishing the last stage calls existing `completeSession` with `diagramSnapshot` built via existing `resolveBestDiagramSnapshot`-style logic (`exportSceneToPng` on the live scene + trimmed scene).

## 6. AI feedback (canvas → text bridge)

No new AI endpoint. `canvas-serializer.ts` (extending the bound-text-aware `buildDiagramDescription` in `src/lib/diagram-description.ts`) converts the current stage's elements — tagged with the stage id, plus untagged elements spatially inside the stage region — into structured text: shapes with labels, arrows as `A → B` connections, free text verbatim. That text becomes `userAnswer` for the existing `/api/ai/evaluate` payload (`{problem, phase, phaseKey, subStep, userAnswer, problemDetails}`), with seniority appended to the prompt context.

Two entry points, one pipeline:

| Entry | Where | Behavior |
|-------|-------|----------|
| **Submit for Review** | stage dock | Full evaluation → `FeedbackSchema` result rendered in the rail; records a `StepSubmission`; sets stage status (`submitted`/`passed`). Never blocks navigation. |
| **Read my canvas** | guide rail (subtle) | Same call, rendered as lightweight inline notes (`✓ / → / ?` tags per the design); **not** recorded as a submission. |

Existing typed error semantics (`ai_unavailable`, `ai_rate_limited`, `ai_failed`) are surfaced in the rail; never fake a score.

## 7. UI

Dark, minimal, low-noise — matching the design capture. Tailwind v4 + existing tokens (`src/styles/tokens.ts`, `DESIGN_SYSTEM.md`); no new UI deps.

- **Full-bleed canvas** — the page is the canvas; no left sidebar.
- **Guide rail** (right, 292 px, collapsible to a floating "Guide" chip): stage title, `step n of N · ideal ≈Xm`, progress ticks (clickable), "FOCUS ON" tips, "WORTH CONSIDERING" suggestions (dashed cards, explicitly reference-only), feedback area (idle button / shimmer loading / notes), seniority chip, optional timer mirror.
- **Stage dock** (bottom center): `‹ ›` navigation, per-stage tick bars (active = accent, done = dim, future = faint), `label · ≈budget · n/N`, `←`/`→` keyboard navigation. Navigation is free — no gating; guidance, not enforcement.
- **Quiet timer** (top-right): mono font, muted color, click to pause — wired to existing `togglePracticeTimer`. Counts up against total budget; never alarms, never turns red.
- **Explanation card** (first entry per stage, centered): `STEP n OF N · ≈budget`, title, 2–3 sentence explanation, "Got it — start sketching" / `esc`. The first card embeds the seniority picker.
- **Breadcrumb** (top-left): `← Problem title / stage label`; back returns to the problems list (session auto-saved).

## 8. Error handling

- localStorage quota → toast (existing pattern), keep session in memory.
- Corrupt/failed scene load → start with a fresh scene + toast; never crash the session. DB copy is not overwritten until the next successful user edit sync.
- Server sync failure → non-blocking retry with backoff; "saved locally" indicator.
- Evaluate failures → typed error notes in the rail with retry.
- `CanvasStage` wrapped in the existing `ErrorBoundary`.

## 9. Testing

- **Vitest (colocated `__tests__/`):** stage-journey adapter (including collapsed stages for lite/OOD problems), element-tagging diff logic, canvas→text serializer, store transitions (stage advance, feedback state machine, seniority), page-seam flag branch (flag on/off renders the right component).
- **Flag verification:** seed dark → old flow unchanged; per-user override on → new flow; override off again → old flow with old localStorage drafts intact.
- **Manual/E2E:** flag-off regression pass (only the page seam and flag registry are touched in existing code); flag-on happy path from Problem Understanding to completion; mid-session refresh resume; cross-device resume via DB state.

## 10. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Canvas serializer produces weak text → poor AI feedback | High | Bound-text-aware serialization; include arrows as relations; iterate on serializer with unit fixtures |
| Element tagging misses (paste, duplicate, library) | Medium | Fallback: spatial containment in stage region counts as stage content |
| Old-flow regression via page seam | Medium | Seam is a single conditional render; flag-off e2e pass |
| `PracticeSession` Json columns grow large | Low | Files stripped + scene trimmed; same policy as existing `diagramSnapshot` |
| Zustand new dependency | Low | ~1 kB, no API surface overlap with existing patterns |

## Deferred (explicitly out of v1)

Interview Mode, Voice Panel, Practice Aloud, AI Probe, Export PDF, Help Assistant, guided tour, solution viewer, submission history UI, embedded-image persistence, Excalidraw stencil library for SD icons.
