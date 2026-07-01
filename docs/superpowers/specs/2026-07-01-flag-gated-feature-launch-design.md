# Flag-Gated Feature Launch — Design

> **Status:** Approved design, ready for implementation planning.
> **Context:** Follows the [competitive analysis](2026-06-30-competitive-analysis.md) and [fresher roadmap plan](../plans/2026-06-30-fresher-roadmap-review.md).
> **App root:** `ultimate-sd/`

## Goal

Build five features in two short cycles (5 days core + 5 days voice), all dark-launched behind plan-aware feature flags, then roll them out one by one over the following month by flipping flags — no deploys required for releases. Features are tied to plan entitlements; recurring-cost AI features live only on recurring-revenue plans.

## What already shipped (baseline, not in scope)

- Solution viewer enabled (`features.ts`)
- Free tier expanded to 8 problems (`plans.ts`)
- Roadmap progress sync (`roadmap-progress.ts`) and 8-week SE schedule (`roadmap-schedule.ts`)
- Excalidraw canvas migration (treated as done)
- Playwright + Vitest infrastructure with existing e2e specs

---

## 1. Feature-flag + entitlement architecture

### Data model

```
feature_flags:           key · enabledPlans (jsonb, e.g. ["ai"]) · updatedAt
feature_flag_overrides:  flagKey · userId · mode (granted | denied)
```

### Resolution — single access function

```
canAccess(user, feature):
  override = getOverride(user.id, feature)
  if override == granted → true      # regardless of global flag AND plan
  if override == denied  → false     # wins over everything
  return user.plan ∈ flag(feature).enabledPlans
```

- `enabledPlans: []` = dark launch — invisible to everyone except individually granted users.
- Launching to a plan = adding that plan to `enabledPlans`; every user on it gets the feature instantly.
- `granted` deliberately bypasses plan entitlement so a test user on Free can exercise an AI-Pro feature exactly as it will ship.
- `canAccess()` is enforced in **server actions and API routes**, not just UI — a dark feature must return 403 to direct API calls.

### Seed defaults

Code-defined entitlement matrix in `plans.ts` seeds each flag's intended plan set and acts as fallback when a DB row is missing. After seeding, the DB is the live source of truth.

### Admin UI

On the existing admin panel: per-flag plan checkboxes (Free / Platform / Lifetime / AI Pro) + per-user override management (search by email, grant/deny per flag). Deviating from the seed default shows a confirmation with the default highlighted (soft guardrail).

### Plan lineup (4 plans)

| Entitlement | Free | Platform ₹299/mo | Lifetime ₹1,999 one-time | AI Pro ₹699/mo |
|---|---|---|---|---|
| 8 starter problems | ✅ | ✅ | ✅ | ✅ |
| Full 86-problem library | ❌ | ✅ | ✅ | ✅ |
| Solutions viewer | ❌ | ✅ | ✅ | ✅ |
| Fresher track | ✅ (free problems only) | ✅ | ✅ | ✅ |
| Interview mode (timed) | ❌ | ✅ | ✅ | ✅ |
| AI evaluate/help — BYOK | ✅ | ✅ | ✅ | ✅ |
| AI evaluate/help — platform-funded | 20 credits/mo | ❌ | ❌ | ✅ |
| AI probe interviewer | BYOK only | BYOK only | BYOK only | ✅ funded |
| Voice interview | ❌ | BYOK | BYOK | ✅ funded |

Rule: **lifetime never includes platform-funded AI** — recurring token costs require recurring revenue.

---

## 2. Features

### F1 — Fresher track + dual-ICP positioning (flag: `fresherTrack`)

- New `fresher` track in `RoadmapData.tsx`: Phase 0 Foundations (concept cards linking to existing widgets — no new problems) → OOP/LLD Classics (Parking Lot, Elevator) → First HLD (TinyURL, REST API) → Scale Basics (Rate Limiter, Notification) → Interview Ready (timed mock).
- All problems already exist in the catalog; most are already free-tier.
- Landing hero keeps senior message, adds a "Starting from zero? → Fresher Path" split CTA. Flag off = zero visual change.
- Fresher variant of the 8-week schedule in `roadmap-schedule.ts`.

### F2 — Timed interview mode (flag: `interviewMode`)

- "Start Interview" entry on the practice page: 45-min lite or 60-min full countdown via existing `TimerWidget`.
- Lite phase set (Clarify → HLD diagram → Trade-offs) building on existing `interview-lite-steps.ts`; a session-config **mode over** `StepByStepChat`, not a parallel flow.
- No Socratic help during the session; end-of-session AI evaluation summary + PDF export.

### F3 — AI probe interviewer (flag: `aiProbe`)

- Promotes legacy `/api/ai/chat` into main practice UX as opt-in "Probe mode" after a step evaluation passes: 2–3 adversarial follow-ups with a distinct interviewer persona prompt in `langgraph.ts`.
- Consumes AI credits / BYOK identically to evaluate. Funded probe = AI Pro only.

### F4 — Plans & payments rework (flag: `lifetimePlan` for the tier; flag engine itself ships unflagged)

- `lifetime` added to plan enum; one-time Razorpay order flow reusing launch-offer order machinery (`razorpay.ts`); pricing page card; webhook/verification handling.
- Flag engine: two tables, `canAccess()`, admin flags page (global per-plan + per-user overrides).

### F5 — Voice interview mode (flag: `voiceInterview`) — build cycle 2

- Turn-based push-to-talk on top of F2: TTS interviewer question → hold-to-record answer (`MediaRecorder`) → STT → interviewer persona (from F3) → TTS reply + text transcript. Diagram canvas stays available alongside.
- Thin `voice` layer over the existing chat pipeline: one new API route for STT/TTS; transcripts stored like chat sessions. No WebRTC, no streaming infra.
- Provider abstraction consistent with BYOK (OpenAI Whisper/TTS default; BYOK keys used where supported).
- Session model stores `engine: 'turn-based'` so a realtime speech-to-speech engine can slot in later without redesign.
- Entitlement: funded on AI Pro; BYOK on paid plans; not on Free.

---

## 3. Testing strategy

- **Unit (Vitest):** all decision logic — `canAccess()` resolution (override beats plan; empty plans = dark; denied wins), entitlement seeds, interview-mode phase selection, timer expiry, fresher roadmap unlock logic, lifetime order amount/verification, voice session state machine.
- **E2E (Playwright):** one spec file per feature covering money paths — fresher track visible when granted / invisible when not; interview-mode full session; probe round-trip (mocked AI provider); lifetime checkout (mocked Razorpay) → plan updated → library unlocked; admin flips flag → user gains access; voice session with mocked audio providers.
- **Flag-gating security specs:** direct API calls as an unentitled user return 403 — protects the dark launch.
- **Rule:** no numeric coverage gate. All decision logic has unit tests; all user-visible flows have an e2e spec. Every feature PR lands with its tests; CI runs both suites.

---

## 4. Build schedule

### Cycle 1 — core four (days 1–5, two parallel streams)

| Day | Stream A (foundation-critical path) | Stream B (parallel) |
|---|---|---|
| 1 | Flag engine: tables, migrations, `canAccess()`, seeds + unit tests | Fresher track data + Phase 0 content in `RoadmapData.tsx` |
| 2 | Admin flags UI (global per-plan + per-user overrides) + e2e | Fresher roadmap pages, landing dual-CTA, schedule variant + e2e |
| 3 | Plans rework: lifetime enum, Razorpay one-time flow, pricing card + tests | Interview mode: session config, lite phase set, timer integration |
| 4 | AI probe: persona prompt, practice-UX entry, credit gating + tests | Interview mode: end-of-session evaluation, PDF, e2e specs |
| 5 | **Integration day (both streams converge):** wire all features through `canAccess()`, flag-gating security specs, full regression, fix fallout, seed all flags to `enabledPlans: []` | — |

Day 5 ships no features by design — it is the integration buffer. Everything merges dark; `main` stays deployable throughout.

### Cycle 2 — voice (days 6–10)

STT/TTS plumbing → push-to-talk UI → persona wiring → transcript persistence → unit/e2e with mocked audio providers. Ships dark.

### Rollout month (owner flips flags; suggested order only)

| Week | Flag | Suggested plans |
|---|---|---|
| 1 | `fresherTrack` | all plans |
| 2 | `lifetimePlan` | public |
| 3 | `interviewMode` | paid plans |
| 4–5 | `aiProbe`, then `voiceInterview` | AI Pro funded; BYOK elsewhere |

Before each flip: grant to a test user via override → verify the real experience → enable for plans.

---

## 5. Success metrics

| Metric | Feature |
|---|---|
| % new users entering fresher track; Phase 0 → first problem completion | F1 |
| Interview-mode sessions started/completed per week | F2 |
| Probe opt-in rate after passed evaluations | F3 |
| Lifetime conversions; free → paid rate post-launch | F4 |
| Voice sessions per AI Pro user; AI Pro upgrades attributed to voice | F5 |

## Key files

| Purpose | Path |
|---|---|
| Plan/entitlement seeds | `ultimate-sd/src/lib/plans.ts` |
| Static feature defaults | `ultimate-sd/src/lib/features.ts` |
| Roadmap content | `ultimate-sd/src/components/roadmap/RoadmapData.tsx` |
| Schedules | `ultimate-sd/src/lib/roadmap-schedule.ts` |
| Practice flow | `ultimate-sd/src/components/StepByStepChat.tsx`, `PracticeUI.tsx` |
| Lite steps | `ultimate-sd/src/lib/interview-lite-steps.ts` |
| AI pipeline | `ultimate-sd/src/lib/langgraph.ts`, `src/app/api/ai/chat` |
| Payments | `ultimate-sd/src/lib/razorpay.ts` |
| Timer | `ultimate-sd/src/components/TimerWidget.tsx` |

## Deferred (explicitly out of scope)

Company-tagged lists, cloud session sync, SD-specific canvas palette, internals widget track, human mock marketplace, realtime speech-to-speech voice, native mobile app.
