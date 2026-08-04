# Problem Intro System — Modular Intros + Inline Step Hints + Admin Generation

> **Status:** Approved (2026-07-12)
> **Spec version:** v1.0
> **Scope:** A modular intro section for every problem (story hook, journey map, key concepts), shown as a first-entry overlay and revisitable in-session; inline per-step interaction hints; admin-only runtime AI generation of intro content. Applies to the **current live flow** (`PracticeUI` / `StepByStepChat`) — explicitly not part of problem-flow-v2.

---

## Executive summary

Every problem gets a consistent, modular intro: a story-style scenario hook, a computed journey map of the session ahead, and a key-concepts primer. It appears as a pre-session overlay on first entry and stays reopenable from the session header. Each step additionally shows a short inline interaction hint at the point of input.

Content resolves through three tiers: admin-generated (DB) → hand-authored bespoke (code, pilot set) → auto-derived fallback (built from existing problem fields). Admins can generate and edit intros at runtime via AI from the admin dashboard; players only ever read resolved content.

## Decisions log

| Question | Decision |
|----------|----------|
| Placement | Both: first-entry overlay + revisitable panel ("Brief" button) |
| Intro contents | Story hook, journey map, key concepts. Interaction guidance lives inline per step, not in the intro |
| Intro form | Pre-session overlay/modal over the practice screen; no routing changes |
| Authoring | Bespoke for a pilot set (~6 flagship problems) + derived fallback for the rest |
| Runtime generation | Admin-only (role `ADMIN`), draft → preview/edit → save to DB; never player-triggered |
| Resolution priority | DB > code > derived — admins can hot-fix without deploy; deleting the DB row reverts |
| Journey map | Never authored; always computed from `getPracticeSteps(slug, difficulty)` |
| Target flow | Current live flow only (`PracticeUI`/`StepByStepChat`); problem-flow-v2 untouched |

---

## 1. Content model

New type in `src/types/index.ts`:

```ts
export interface ProblemIntroContent {
  hook: string;                                   // story-style scenario, 2–4 sentences
  concepts: { term: string; blurb: string }[];    // 2–4 key concepts, one-line blurbs
  source: 'bespoke' | 'generated' | 'derived';    // provenance, for badges/telemetry
}
```

The journey map is **not** part of authored content. The overlay computes it at render time from the problem's resolved steps (the same `problem.steps` already passed to `PracticeUI`), so it is always accurate for all ~86 problems across custom/lite/full modes with zero authoring.

`StepData` gains one optional field:

```ts
interface StepData {
  // ...existing fields
  interactionHint?: string;   // overrides the default inputType-based hint
}
```

## 2. Resolution — three tiers, one function

`getProblemIntro(slug)` in `src/lib/problem-intro-resolver.ts`, called server-side from `src/app/practice/[slug]/page.tsx` and passed down to `PracticeUI`:

1. **DB** — `ProblemIntro` Prisma row for `problemSlug`. Validated with zod on read; malformed rows fall through to tier 2 (and log a warning).
2. **Code** — `src/lib/problem-intros.ts`: `PROBLEM_INTROS: Record<string, Omit<ProblemIntroContent, 'source'>>`, slug-keyed like `problem-steps.ts`. Pilot set: `design-tinyurl`, `design-whatsapp`, `design-distributed-cache`, `design-youtube`, `design-twitter`, `design-rate-limiter`. Each hand-written to the same structure (hook 2–4 sentences; 2–4 concepts).
3. **Derived** — `buildFallbackIntro(problem)`:
   - `hook`: second-person reframe assembled from `problem.context` (template: role + scenario sentence + the context's scale/twist sentences carried over verbatim).
   - `concepts`: mapped from `problem.tags` (and `category` as backup) through a small static tag→blurb dictionary (`TAG_CONCEPTS`) covering the common tags (caching, sharding, hashing, queues, websockets, rate-limiting, consistency, CDN, search/indexing, geo, streaming, idempotency…). Tags without an entry are skipped; if fewer than 2 concepts result, the concepts section is omitted from the overlay rather than padded.

Custom problems (`custom-*` slugs) always use tier 3.

## 3. Player-facing UI

### 3.1 `ProblemIntroOverlay.tsx` (new component)

Rendered by `PracticeUI`. Modal overlay (Radix Dialog, matching existing modal patterns e.g. `OnboardingModal`), sections top to bottom:

1. **Header** — problem title, difficulty, category.
2. **The scenario** — the `hook`.
3. **Your journey** — computed map of phases → steps: phase name, step count, step titles, an icon per input type (list / write / schema / diagram). Compact, scannable; not interactive beyond scroll.
4. **Key concepts** — term + one-line blurb chips/cards. Omitted entirely when empty.
5. **CTA** — "Start solving" button; `esc`/backdrop click also dismisses.

**First-entry gating:** shown automatically when localStorage `sd_problem_intro_seen_<slug>` is absent; set on dismiss. Same pattern as `PracticeTour` (`sd_practice_tour_done_v1`). To avoid stacking, `PracticeTour` is suppressed while the overlay is open and fires only after intro dismissal (overlay-open state gates the tour's mount).

**Revisit:** a "Brief" button in the `PracticeUI` header reopens the same overlay anytime (no gating; dismissing again does not re-trigger the tour).

Interview mode (`interviewConfig` present) skips the auto-show, consistent with the tour being disabled there; the Brief button remains available.

### 3.2 Inline per-step hints in `StepByStepChat`

A muted one-liner rendered under the step title (near the `currentStep.title` heading, ~line 923):

- Default text from a static map `INPUT_TYPE_HINTS`:
  - `list` → e.g. "List one item per line — aim for 4–6 crisp entries."
  - `textarea` → "Write a short structured answer; bullet points are fine."
  - `schema` → "Define tables/entities with fields and types."
  - Diagram sub-steps (via existing `isDiagramSubStep`) → "Sketch boxes and arrows on the canvas; label every component."
- `currentStep.interactionHint` overrides the default when present.

No authoring needed for baseline coverage; bespoke steps can override selectively.

## 4. Admin runtime generation

### 4.1 Prisma

```prisma
model ProblemIntro {
  id          String   @id @default(cuid())
  problemSlug String   @unique
  hook        String
  concepts    Json     // { term, blurb }[]
  createdBy   String?  // admin user id
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

One migration; no changes to existing models.

### 4.2 Server actions (`src/app/actions/problem-intros.ts`)

All guarded by the same admin check as `src/app/admin/page.tsx` (session user's `role === 'ADMIN'`; otherwise throw):

- `generateProblemIntroDraft(slug)` — builds a structured-output prompt (LangChain, existing model setup used by `/api/ai/*`) from the problem's `context`, FRs, NFRs, `tags`, plus the expert solution from `solutions.ts` when available. Returns a zod-validated `{ hook, concepts }` draft. **Not persisted.**
- `saveProblemIntro(slug, { hook, concepts })` — upsert the DB row, stamping `createdBy`.
- `deleteProblemIntro(slug)` — delete the row (reverts resolution to code/derived).

Generation failures surface the existing typed AI error semantics (`ai_unavailable`, `ai_rate_limited`, `ai_failed`) to the panel; nothing is written on failure.

### 4.3 Admin UI — `ProblemIntrosPanel`

New panel on the admin dashboard (sibling of `FeatureFlagsPanel`):

- Problem list (all `PROBLEMS`) with a source badge per problem: **DB** / **bespoke** / **derived**.
- Per problem: **Generate** → draft preview with editable hook + concepts fields → **Save** / discard; **Delete** on DB-backed intros to revert.
- Players never trigger generation; session open cost is one indexed DB lookup in the server page loader.

## 5. Error handling

- DB lookup failure or malformed row → fall through to next tier; never block session load.
- Overlay render errors are contained by the existing `ErrorBoundary` wrapping; worst case the session behaves as today (no intro).
- localStorage unavailable → treat the intro as seen and never auto-show (same convention as the tour, which treats read failure as "seen"); the Brief button still works.
- Admin generation failure → typed error + retry in panel; no partial writes.

## 6. Testing

- **Vitest:**
  - Resolver priority: DB > code > derived; malformed DB row falls through; `custom-*` uses derived.
  - `buildFallbackIntro`: hook assembly from context; tag→concept mapping; <2 concepts → empty concepts.
  - `INPUT_TYPE_HINTS` covers every `inputType` plus diagram sub-steps; `interactionHint` override wins.
  - Overlay gating: auto-show when key absent, not when present; Brief reopen ignores gating; tour suppressed while overlay open.
  - Server actions: admin guard rejects non-admins; zod validation of generated drafts.
- **E2E:** update `suppressFirstRunUx(page)` to pre-seed `sd_problem_intro_seen_<slug>` so existing practice-path tests stay green. One new test: fresh entry shows intro → journey map lists phases → dismiss → tour may fire → "Brief" reopens overlay.
- Run `scripts/validate-problems.ts` unchanged (no `problems.ts` content changes).

## 7. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Derived hooks read as bland/templated | Medium | Carry context's scale/twist sentences verbatim; pilot bespoke set covers flagship traffic; admins can generate better ones anytime |
| Overlay + tour stacking annoys first-time users | Medium | Explicit sequencing: tour gated on intro dismissal |
| Generated content quality varies | Medium | Draft-preview-edit flow; nothing auto-published; delete-to-revert |
| E2E flake from new first-run gate | Low | `suppressFirstRunUx` updated in the same change |

## Out of scope

- Problem-flow-v2 (untouched).
- Player-triggered or automatic bulk generation.
- Localization, media/illustrations in intros, per-seniority intro variants.
