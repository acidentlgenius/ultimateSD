# Ultimate SD — Road to a World-Class Product

**Created:** 2026-07-08 · **Status:** Proposed
**Source:** Full codebase audit (new-user UX flow, problem-content completeness, latent-bug inventory).

This plan fixes, in order: (1) the broken new-user funnel, (2) reliability bugs users will definitely hit mid-session, (3) incomplete problem content, (4) the regression safety net that keeps it all fixed. Phases are incremental — each ships independently and delivers user-visible value on its own.

---

## The three root problems (audit summary)

**A. New users can't start.** The path from landing to solving a problem is 7–10 steps. Problems marketed as free hit a hard login wall ([practice/[slug]/page.tsx:47](ultimate-sd/src/app/practice/[slug]/page.tsx) redirects every anonymous visitor to login, contradicting `access.ts` which marks 8 slugs free). Email verification loses the user's `callbackUrl`. The hero's primary CTA only scrolls the page. First-time users are dropped cold into a 646-line multi-panel practice screen with zero guidance.

**B. Sessions break in ways users will definitely hit.** No error boundary anywhere (one component crash = blank screen, session lost). AI provider failures (429 rate-limit, 403 out-of-credits) are shown as either a generic "try again" or — worse — a **score of 0 / "Needs Improvement"**, because `/api/ai/evaluate` returns HTTP 200 with fake failing feedback on any model error. Unvalidated AI JSON can persist `NaN` scores. Diagram persistence is the most-patched area in git history (~8 fix commits) and still loses/restores state wrongly. Refresh after skipping a step throws users back to the skipped step.

**C. Problem content is systematically incomplete.** All **86/86** problems have empty `nonFunctionalRequirements` (failing the platform's own authoring validator) and one-sentence contexts (18–69 chars) — and `context` is the primary grounding for the AI interviewer, evaluator, and debrief. Only **4/86** have expert solutions (which is what actually drives evaluation quality), **39/86** fall back to a generic step template, **80/86** have no guide. Only 3 problems are rated Easy — there is no beginner ramp.

---

## Phase 0 — Stop the bleeding (trust-critical, ~1 week)

Small, high-leverage fixes. A user who hits any of these today concludes the product is broken.

### 0.1 Make the login gate graceful ⬛ CRITICAL
**Product decision (2026-07-08): no guest sessions — login is required to solve problems.** The fix is therefore not bypassing auth but making the gate honest and place-preserving.

- [ ] Free-problem cards shown to anonymous users must say what happens ("Sign in to practice — free") instead of implying instant access
- [ ] Preserve `callbackUrl` end-to-end: problem → login → signup → email verification → back to the same problem
- [ ] E2E test: anonymous visitor → click free problem → login/signup → verify → lands back in that problem's practice UI

### 0.2 Global error boundaries ⬛ CRITICAL
There is no `error.tsx` or ErrorBoundary anywhere; any render throw blanks the page.

- [ ] Add root `ultimate-sd/src/app/error.tsx` + `global-error.tsx` with "Reload — your progress is saved" recovery UI
- [ ] Add route-level `error.tsx` for `/practice/[slug]` that preserves session state on recovery
- [ ] Wrap `DiagramCanvas` (Excalidraw) in a component-level ErrorBoundary — a canvas crash must not kill the chat pane
- [ ] Wrap `StepByStepChat` feedback rendering likewise
- [ ] Guard `StepByStepChat.tsx:854` date formatting against `Invalid Date` (guard in `session-storage.ts:233` too)
- [ ] Test: force a render throw in each boundary; verify recovery without losing session

### 0.3 Truthful AI-error UX ⬛ CRITICAL
Model failures currently read as user failures.

- [ ] `/api/ai/evaluate/route.ts` (~389–401): on LLM error, return a real error status (502/429 pass-through) — **never** HTTP 200 with `score: 0, isAcceptable: false`
- [ ] Validate model output against a Zod schema before returning (~line 374); on invalid/missing fields, retry once then return an error — never `NaN` into `recordStepSubmission`
- [ ] Wire the existing `getFetchErrorMessage` (`fetchUtils.ts:7`) into the **live** path `StepByStepChat.tsx:729-740` and `HelpAssistant.tsx:106` (it currently serves only the dead `ChatInterface`) — 403 must say "add API key / credits", 429 must say "rate-limited, retrying"
- [ ] `fetchUtils.ts:50-70`: don't retry deterministic 4xx (401/402/403/404); retry only 429/5xx/network, honoring `Retry-After`
- [ ] Distinct UI treatment: "we had a problem" (amber, retry button, no score recorded) vs. "your answer needs work" (feedback)
- [ ] E2E tests with mocked 403 / 429 / 500 / malformed-JSON responses asserting exact user-visible copy

### 0.4 Navigation quick wins 🟨 HIGH
- [ ] Hero primary CTA (`Hero.tsx:68`): point "Start Exploring" at a real destination — a free problem or `#problems` — not `#features`
- [ ] Promote "Problems" to a top-level nav item (`navigation.ts:26-41`); demote/regroup Roadmap/Guides/Custom/Draw under "More" or "Practice"
- [ ] Show Sign in / Get Started on mobile header (`UserMenu.tsx:86` — currently `hidden sm:flex`)
- [ ] Carry `callbackUrl` through the email-verification link so verified users land back on their problem
- [ ] Move `ProblemExplorer` higher on the landing page (currently ~5 sections deep in `DashboardClient.tsx:94-118`)

**Phase 0 exit criteria:** anonymous visitor reaches a working practice session in ≤ 2 clicks; no AI failure ever shows a score; no crash ever blanks the page.

---

## Phase 1 — Frictionless first session (onboarding, ~1–2 weeks)

### 1.1 First-run guidance in the practice UI 🟨 HIGH — ✅ DONE 2026-07-08
`PracticeUI` (646 lines) drops first-timers into chat + canvas + timer + phases + help assistant with zero guidance.

- [x] 4-step coach-mark tour on first practice session (`PracticeTour.tsx`): ① step journey sidebar, ② answer in chat, ③ sketch on canvas, ④ help assistant — anchored spotlight on desktop, centered fallback on mobile; suppressed during interview mode
- [x] "How this works" first-step hint in the chat pane before any progress (`StepByStepChat.tsx`, dismissible, localStorage-persisted)
- [x] Persist tour-completed flag (localStorage); "Take the tour" replay button in the sidebar footer
- [ ] Contextual first-time tooltips for timer, phase tabs (deferred — tour covers the essentials)

### 1.2 Rework onboarding modal 🟨 HIGH — ✅ DONE 2026-07-08
Currently a blocking 4-step preference quiz before any value (`DashboardClient.tsx:59`).

- [x] Skippable at every point: "Skip for now" button + backdrop/ESC dismiss both persist via new `skipOnboarding()` server action (no re-nag)
- [x] Reduced to one goal screen → "You're set" screen deep-linking an intent-matched free problem (`RECOMMENDED_FIRST_PROBLEM`: interview→WhatsApp, upskill→Distributed Cache, learn→TinyURL)
- [x] Company/difficulty/focus collection demoted to optional "Fine-tune recommendations" screen off the critical path
- [x] Modal only renders on `/` — users arriving via `callbackUrl` to a problem never see it

### 1.3 A real beginner ramp 🟨 HIGH — ✅ DONE 2026-07-08
Only 3 of 86 problems are Easy.

- [x] Re-rated `design-lru-cache` and `design-elevator-system` to Easy (`design-parking-lot` already was)
- [x] "Start here" track of 5 **all-free** problems (TinyURL → Parking Lot → Elevator → Typeahead → Dropbox) in `lib/start-here.ts` + `StartHereTrack.tsx` on the landing page, with per-problem completion state and a continue CTA (free-only chosen over the original example list so the beginner path never hits a paywall)
- [x] "Up next" recommendation card on session completion (`CompletionUI.tsx` via `getNextProblem`: track order first, then free same-category fallback)

### 1.4 Consistent gating UX 🟦 MEDIUM — ✅ DONE 2026-07-08 (scoped to no-guest-sessions decision)
- [x] Anonymous viewers now see honest "Sign in to practice" CTAs on problem cards and table rows (`ProblemCard.tsx` `signedIn` prop, `ProblemExplorer.tsx`) instead of "Practice" that led to a surprise login wall; locked content keeps the in-page `ProModal`
- [x] Interview/voice `FeatureUpsell` reviewed — already explains the feature with a "Practice without…" continue link; no change needed
- [x] Audited `access.ts` consumers: the free-card vs. login-wall mismatch was the only card-state/gate divergence; server redirect preserves `callbackUrl` (verified live)

**Phase 1 exit criteria:** a first-time user completes ≥ 1 practice step unaided; onboarding is skippable; there is an obvious Easy path.

---

## Phase 2 — Sessions that never lose work (reliability, ~2 weeks)

### 2.1 Diagram persistence hardening 🟨 HIGH — chronic worst area (~8 fix commits)
- [ ] Fix empty-scene bug (`DiagramCanvas.tsx:100`): persist deliberate deletes (save `{elements: [], clearedAt}`) so cleared canvases stay cleared after refresh
- [ ] Replace the `isRestoringRef` / `pendingSceneRef` / `canvasEpoch` / double-rAF guard web with a single state machine: `loading → restoring → live`, persisting only in `live`
- [ ] Debounced auto-save with a visible "Saved ✓ / Saving…" indicator
- [ ] `beforeunload` flush of unsaved scene state
- [ ] Unit tests: restore-then-edit, clear-then-refresh, rapid step-nav, concurrent restore/change
- [ ] E2E: draw → refresh → assert scene identical; clear → refresh → assert still empty

### 2.2 Session lifecycle correctness 🟨 HIGH
- [ ] Deduplicate `startPracticeSession` (called from both `PracticeUI.tsx:175` and `StepByStepChat.tsx:320`) — single owner, or idempotent upsert server-side
- [ ] Fix resume-after-skip (`findResumePosition`, `StepByStepChat.tsx:337`): record skipped steps so refresh returns to the furthest position, not the first skipped step
- [ ] Restore-banner date: guard invalid `lastUpdated` (`session-storage.ts:233`)
- [ ] Simple session dashboard: list in-progress sessions with "Resume" (closes the open `report.json` next-step)
- [ ] E2E: mid-session refresh, skip-then-refresh, guest-session restore

### 2.3 AI pipeline robustness 🟦 MEDIUM (builds on 0.3)
- [ ] Zod-validate every AI JSON response at the API boundary (evaluate, chat, help, debrief)
- [ ] One retry with corrective prompt on malformed model output before failing
- [ ] Timeout + AbortController on model calls with clean user-facing timeout message
- [ ] "Regenerate feedback" button on any failed evaluation (no penalty, nothing persisted for failures)
- [ ] Remove dead `ChatInterface.tsx` + its test (false confidence; live path is `StepByStepChat`)

### 2.4 Known small bugs 🟦 MEDIUM
- [ ] Fix orphaned solution slug: `solutions.ts` `design-distributed-job-scheduler` → `design-task-scheduler` (expert solution currently never binds)
- [ ] Add `companies` to `design-unique-id-generator` (only problem with an empty list)
- [ ] Sweep demo widgets for uncleared timers (recurring leak theme: crawler, BlockchainDemo, JobSchedulerViz)

**Phase 2 exit criteria:** refresh/crash/navigation never loses user work; zero known ways to see a wrong score.

---

## Phase 3 — World-class problem content (~3–4 weeks, incremental batches)

Content upgrades ship in slug-batches so every batch is releasable. Priority order within each batch: free problems → "Start here" track → most-practiced (check analytics) → rest.

### 3.1 Define & enforce the content bar 🟨 HIGH (do first)
- [ ] Author a `CONTENT_STANDARD.md`: every problem must have rich context (≥ 300 chars: what/scale/constraints), ≥ 3 FRs, ≥ 3 NFRs with targets ("p99 < 200ms"), companies, tags, correct difficulty, bespoke steps, expert solution
- [ ] Turn `problem-validation.ts` into a CI gate over `PROBLEMS` (today 86/86 fail its own NFR rule) — start warn-only with a ratchet, flip to hard-fail once a batch passes
- [ ] Script: `scripts/content-coverage.ts` printing per-problem completeness so progress is measurable

### 3.2 Contexts + NFRs for all 86 problems ⬛ CRITICAL for AI quality
`context` is the main grounding for interviewer, evaluator, and debrief; all 86 are one-liners.

- [ ] Batch 1: 8 free + "Start here" problems — full contexts (scenario, scale numbers, constraints) + quantified NFRs
- [ ] Batch 2: remaining Core Services + Basics (~28)
- [ ] Batch 3: Advanced + ML-Infused + Edge Cases (~50)
- [ ] Feed NFRs into the evaluate/interview prompts (today `nonFunctionalRequirements` is read by **no** runtime prompt — wire it in or the data stays dead)
- [ ] Spot-check after each batch: run 3 sessions/problem, confirm the interviewer probes the new constraints

### 3.3 Bespoke steps for the 39 generic-template problems 🟨 HIGH
- [ ] Triage the 39: write bespoke steps for real interview staples (recommendation-engine, file-storage, video-call, logging, data-lake/warehouse/ETL, HA/API-gateway/event-driven, …)
- [ ] Consider retiring or demoting speculative titles that dilute the library (quantum-computing, brain-computer-interface, metaverse, space-debris) — mark "experimental" or cut
- [ ] Improve `getGenericFallbackSteps` for whatever legitimately remains generic (inject the problem's FRs/NFRs into the template)

### 3.4 Expert solutions — the evaluation-quality lever 🟨 HIGH
Only 4/86 problems get expert-grounded evaluation today.

- [ ] Target: expert solutions for the top 30 problems (free + Start-here + Core Services first)
- [ ] Solution template: architecture, data model, scale math, trade-offs, common mistakes (mirror the existing 4)
- [ ] Verify each new solution binds by slug and measurably changes evaluator output (A/B one problem before/after)

### 3.5 Guides + duplicates 🟦 MEDIUM
- [ ] Guides for the "Start here" track and top-10 problems (6/86 today; only TinyURL has both guide *and* solution — align the two sets)
- [ ] Resolve near-duplicate clusters (feed/reco, search, cache, resilience): differentiate scope explicitly or merge
- [ ] Rebalance categories ("Advanced" = 33 while "Edge Cases" = 5) and audit all difficulty ratings against the new standard

**Phase 3 exit criteria:** 100% pass the content validator; top 30 problems have bespoke steps + expert solutions; no problem produces a generic, ungrounded interview.

---

## Phase 4 — Keep it world-class (safety net + polish, ongoing)

### 4.1 Test the paths users actually hit 🟨 HIGH
- [ ] E2E: full anonymous funnel (land → free problem → guest session → signup → session migrated)
- [ ] E2E: AI failure matrix (403/429/500/timeout/malformed JSON) — today `ai-mocks.ts` only mocks success
- [ ] E2E: persistence suite (refresh mid-session, skip-then-refresh, diagram clear/restore, completion flow)
- [ ] Replace brittle text selectors with `data-testid` (button renames broke e2e 3× in recent history)
- [ ] CI: content validator + coverage script from 3.1

### 4.2 Instrument the funnel 🟦 MEDIUM
- [ ] PostHog events: landing CTA click, problem opened, session started, first answer submitted, first feedback received, signup, D1 return
- [ ] Funnel dashboard + drop-off alerts; error-rate tracking on AI endpoints
- [ ] Use most-practiced-problem data to order Phase 3 content batches

### 4.3 Polish backlog 🟦 LOW (schedule after the above)
- [ ] Doc-tracked wishlist: hints system, per-step timing, drag-drop diagram load, keyboard shortcuts, replace-diagram warning
- [ ] Repo hygiene: archive the ~20 stale status/*.md docs at `ultimate-sd/` root into `docs/archive/`; delete stale root `plan.md` (an old email-fix note)

---

## Sequencing at a glance

| Phase | Duration | Theme | Ships |
|---|---|---|---|
| 0 | ~1 wk | Trust-critical fixes | Free-problem access, error boundaries, honest AI errors, nav quick wins |
| 1 | 1–2 wk | First-session experience | Tour, lean onboarding, beginner ramp, consistent gating |
| 2 | ~2 wk | Never lose work | Diagram + session persistence, AI validation, small bug sweep |
| 3 | 3–4 wk | Content depth (batched) | Contexts+NFRs ×86, steps ×39, solutions ×30, guides, dedup |
| 4 | ongoing | Safety net | Failure-path E2E, funnel analytics, polish backlog |

**Definition of world-class (measurable):** anonymous → practicing in ≤ 2 clicks · first-feedback within 5 minutes of landing · zero blank-screen failure modes · zero fake scores · 100% content-validator pass · failure-path E2E green in CI.
