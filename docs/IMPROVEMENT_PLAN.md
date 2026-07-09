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

### 0.1 Make the login gate graceful ⬛ CRITICAL — ✅ DONE 2026-07-08
**Product decision (2026-07-08): no guest sessions — login is required to solve problems.** The fix is therefore not bypassing auth but making the gate honest and place-preserving.

- [x] Free-problem cards shown to anonymous users say "Sign in to practice" (done in Phase 1.4)
- [x] `callbackUrl` preserved end-to-end: signup POST carries it → verification email link embeds it (open-redirect-safe via `safeCallbackPath`) → verify route forwards it to login → login redirects to the problem; resend-verification threads it too
- [ ] E2E test: anonymous visitor → free problem → login/signup → verify → back in that problem (Phase 4 backlog)

### 0.2 Global error boundaries ⬛ CRITICAL — ✅ DONE 2026-07-08
There is no `error.tsx` or ErrorBoundary anywhere; any render throw blanks the page.

- [x] Root `app/error.tsx` + minimal-dependency `global-error.tsx` with "your progress is saved" recovery UI
- [x] Route-level `practice/[slug]/error.tsx` with "Resume session" recovery (session state lives server-side/localStorage, survives reset)
- [x] `DiagramCanvas` wrapped in reusable `ErrorBoundary` component (remount-on-reset via key) — canvas crash leaves chat intact
- [x] Guarded `Invalid Date` in `session-storage.ts` getAllSessions and the restore banner's date formatting
- [x] Verified live: throwaway crashing page rendered the boundary (header intact, Try again / Go home) instead of a blank screen
- [ ] Boundary around feedback rendering specifically (covered by route boundary for now)

### 0.3 Truthful AI-error UX ⬛ CRITICAL — ✅ DONE 2026-07-08
Model failures currently read as user failures.

- [x] `/api/ai/evaluate` returns real statuses: 403 `{error, message}` for access issues, 429 for provider rate limits, 502 for other model failures — never HTTP 200 with `score: 0`
- [x] Zod `FeedbackSchema` validates model output; one corrective re-prompt on malformed JSON, then a real error — `NaN` can no longer reach `recordStepSubmission`
- [x] `getFetchErrorMessage` wired into the live `StepByStepChat` and `HelpAssistant` paths; new `HttpError` carries the server's own message (e.g. "add an API key in Settings") which takes precedence over generic copy
- [x] `fetchWithRetry` no longer retries deterministic 4xx — only 429/408/5xx/network (`Retry-After` honoring left for Phase 2.3)
- [x] Distinct amber "We couldn't grade your answer … nothing was scored or recorded" banner + Try again, separate from red needs-improvement feedback
- [x] Verified live: mocked 403 → instant banner with server message, answer preserved, no score; real submit → genuine graded feedback
- [ ] E2E failure-matrix specs (Phase 4 backlog)

### 0.4 Navigation quick wins 🟨 HIGH — ✅ DONE 2026-07-08
- [x] Hero primary CTA is now "Start Solving" → `/practice/design-tinyurl` (was a `#features` scroll)
- [x] "Problems" promoted to top-level nav; Roadmap/Guides/Custom/Draw grouped under "Learn" (nav unit test updated to the new approved order)
- [x] "Get Started" visible on mobile header ("Sign in" stays `sm+`)
- [x] `callbackUrl` carried through the verification email (see 0.1)
- [x] `ProblemExplorer` + MostAsked moved above FeatureShowcase/AI/Roadmap sections — picking a problem now comes before marketing

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

### 2.1 Diagram persistence hardening 🟨 HIGH — ✅ DONE 2026-07-08 (chronic worst area, ~8 fix commits)
- [x] Empty-scene bug fixed: a `hasHydrated` marker distinguishes "not loaded yet" from "user deleted everything" — deliberate delete-alls now clear storage so cleared canvases stay cleared after refresh. Hydration is confirmed only by OBSERVED content (a failed restore can never wipe the save), and flush-time live-empty reads are never trusted (the keyed Excalidraw child is already unmounted during step-nav flushes and its dead API reports empty — found live, would have wiped scenes on every step navigation)
- [x] "Saving… / Saved ✓" indicator in the canvas header
- [x] Unload flush already existed via `pagehide` (better than beforeunload on mobile)
- [x] Unit tests: delete-all persistence regression test + existing restore/empty-overwrite tests still green
- [x] Verified live: inject scene → refresh → step-nav away/back → scene identical at every checkpoint
- [ ] Full state-machine refactor of the guard web deferred — the guards are load-bearing (see dead-API discovery); revisit only with E2E coverage in place

### 2.2 Session lifecycle correctness 🟨 HIGH — ✅ DONE 2026-07-08 (dashboard deferred)
- [x] `startPracticeSession` deduplicated: PracticeUI is the single owner, passing a `sessionInit` handle to StepByStepChat; the server action also re-checks for an active session inside the transaction. Verified live: fresh problem load creates exactly 1 session, reload stays at 1 attempt
- [x] Resume-after-skip fixed: `findResumePosition` (now `lib/step-resume.ts`) resumes after the furthest completed step; skipped steps become the target only once everything beyond them is done. 6 unit tests incl. the regression case
- [x] Restore-banner invalid-date guards (done in Phase 0.2)
- [ ] Session dashboard with "Resume" list — deferred to polish backlog
- [ ] E2E: mid-session refresh, skip-then-refresh (Phase 4 backlog)

### 2.3 AI pipeline robustness 🟦 MEDIUM — ✅ DONE 2026-07-08 (builds on 0.3)
- [x] Evaluate route Zod-validated with corrective retry (Phase 0.3); help route hardened: no longer leaks raw internal error messages, distinguishes 403/429/502
- [x] "Try again" on failed evaluation with nothing persisted (Phase 0.3 amber banner)
- [x] Dead `ChatInterface.tsx` + its test removed (live path is `StepByStepChat`)
- [ ] Server-side model-call timeout — client-side 15s fetch timeout already bounds the user's wait; server timeout deferred

### 2.4 Known small bugs 🟦 MEDIUM — ✅ DONE 2026-07-08
- [x] Orphaned solution slug fixed: `design-distributed-job-scheduler` → `design-task-scheduler` (expert solution now binds)
- [x] `companies` added to `design-unique-id-generator` (Twitter/Meta/Amazon — the Snowflake question)
- [x] Full timer sweep: 14 widgets fixed with the established ref-tracked-timeout / isMounted-guard patterns (ConfigPropagator, FeedArchitect, ServiceMeshViz, LoadBalancerVisualizer, SidecarVisualizer, RTBSimulator, CDNMap, DFSVisualizer, E2EEncryptionDemo, NotificationSystemDemo, FanoutVisualizer, PipelineVisualizer, GraphQLPlayground, RESTExplorer)

**Phase 2 exit criteria:** refresh/crash/navigation never loses user work; zero known ways to see a wrong score.

---

## Phase 3 — World-class problem content (~3–4 weeks, incremental batches)

Content upgrades ship in slug-batches so every batch is releasable. Priority order within each batch: free problems → "Start here" track → most-practiced (check analytics) → rest.

### 3.1 Define & enforce the content bar 🟨 HIGH — ✅ DONE 2026-07-08
- [x] `docs/CONTENT_STANDARD.md` authored: context ≥300 chars (scenario/scale/twist), ≥3 full FRs, ≥3 quantified NFRs, style rules, batch order
- [x] `validate:problems` added to the CI quality gate (hard-fail — justified because all batches landed same day: 86/86 pass)
- [x] `scripts/content-coverage.ts` prints the per-problem completeness table + summary

### 3.2 Contexts + NFRs for all 86 problems ⬛ CRITICAL for AI quality
`context` is the main grounding for interviewer, evaluator, and debrief; all 86 are one-liners.

- [x] Batch 1 (8 free problems) hand-written; Batches 2–3 (78 problems) generated by parallel agents against the standard and merged via `scripts/apply-content.ts` — **86/86 now standard-compliant** (context ≥300 chars, ≥3 FRs, ≥3 quantified NFRs)
- [x] FRs/NFRs wired into runtime prompts: evaluate route (authored-requirements grounding block), help assistant context, interview debrief
- [x] Live spot-check (design-parking-lot): evaluator's "missed" feedback explicitly cites the new content (vehicle-type mix, payment degraded-mode, occupancy analytics) — grounding confirmed end-to-end
- [ ] Ongoing: spot-check more problems as sessions accumulate; refine any weak generated entries

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
