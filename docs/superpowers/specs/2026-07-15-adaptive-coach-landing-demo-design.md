# Adaptive Coach Landing Demo — Design

> **Status:** Implemented (2026-07-15)  
> **Spec version:** v1.0  
> **App root:** `ultimate-sd/`  
> **Related:** `docs/superpowers/specs/2026-07-14-adaptive-coach-skills-design.md`

---

## Problem

Adaptive Coach personalizes pass bars, attempt caps, and teach-forward so practice doesn’t become an infinite rewrite grind. That behavior is invisible on the marketing landing page. Logged-out visitors never see *why* coaching differs by level.

---

## Goals

1. Logged-out home shows an **interactive** Adaptive Coach demo (not a feature-pillar grid alone).
2. Demo uses the real **`progressGate()`** policy so thresholds/attempts cannot drift from product truth.
3. One fixed faux answer / score drives a **mini session**: submit → retry (when applicable) → teach-forward → advance.
4. Switching level resets the demo and makes the calibration insight obvious.

## Non-goals

- Calling LLM / `/api/ai/coach/turn` for guests.
- Showing the section to logged-in users (v1).
- Mock / Practice mode toggle (v1 = practice only).
- Feature-flagging the marketing section behind `adaptiveCoach` (section is always visible while dark flag may still hide product wiring).
- Full chat parity with `StepByStepChat`.

---

## Decisions

| Question | Decision |
|----------|----------|
| Audience | Logged-out only |
| Interaction | Level picker + mini session |
| Gate source | Real `progressGate` from `@/lib/adaptive-coach` |
| Score | Fixed **5** (see calibration note) |
| Levels shown | Fresher · SDE-1 · Senior |
| Placement | Between `FeatureShowcase` and `AiInterviewerSection` in `DashboardClient` |

**Calibration note:** Conversational draft used score `6`, which makes fresher *and* SDE-1 pass on first try. Score **5** maximizes insight: Fresher → immediate `pass`; SDE-1 → up to 3 `retry` then `teach_forward`; Senior → up to 2 `retry` then `teach_forward`. Thresholds still come from `progressGate` / `getPassThreshold`.

---

## UX

### Frame

- Section title: e.g. “Same answer. Different coach.”
- One-line support: practice is judged for *your* level — and never traps you forever.
- Problem chip: **TinyURL · Requirements** (static).
- Level pills: Fresher / SDE-1 / Senior (maps to `fresher` | `sde1` | `senior`).
- Faux learner answer (static, non-editable or lightly disabled field).
- Primary CTA: **Submit answer**.
- Secondary: **Reset demo**.
- Marketing CTA: **Start practicing** → `/signup` or a free problem path already used on landing (match nearby CTA patterns).

### Status strip

Always show:

- Mode: Practice  
- Pass threshold for selected level (from `getPassThreshold('practice', level)`)  
- Attempts used / max (`getMaxAttempts`)  
- Last gate action badge when present (`pass` | `retry` | `teach_forward`)

### Coach transcript

Append bubbles after each submit (no real LLM):

| Gate action | Bubble intent |
|-------------|----------------|
| `pass` | Affirm level-calibrated pass; show next agenda line (“Next: Data model”). Session complete for demo. |
| `retry` | Tighter nudge; “Try again — N left.” |
| `teach_forward` | One focused tip (authored, TinyURL requirements–themed); badge **Coached advance**; next agenda line; session complete. |

When session completes (`pass` or `teach_forward`), disable Submit until Reset or level change.

### Level change

Selecting a different level:

1. Clears transcript (keep one system opener).
2. Resets attempts to 0.
3. Re-enables Submit.
4. Refreshes threshold / max in the status strip.

---

## Behavior (client)

```
state: level, attempts, messages[], done

onSubmit:
  score = 5
  attempts' = attempts + 1
  decision = progressGate({
    mode: 'practice',
    level,
    score: 5,
    attempts: attempts',
    stageElapsedSec: 0,
    stageBudgetSec: 9999,   // ignore budget path in demo
    sessionRemainingSec: 9999,
  })
  append coach bubble from authored map(decision.action, attempts', level)
  if decision.action in {pass, teach_forward}: done = true
```

Do **not** exercise `advance_budget` / `end_mock` in v1.

Export a tiny pure helper (recommended) for bubble selection / demo orchestration so unit tests can assert Fresher passes once and Senior teach-forwards on attempt 2 — without mounting React.

---

## Component layout

```
ultimate-sd/src/components/landing/AdaptiveCoachDemo.tsx   # section UI
ultimate-sd/src/lib/adaptive-coach/demo/landing-demo.ts    # pure orchestration + copy keys
ultimate-sd/src/lib/adaptive-coach/demo/__tests__/landing-demo.test.ts
```

Wire in `DashboardClient`: `{!user && <AdaptiveCoachDemo />}` between FeatureShowcase and AiInterviewerSection.

Reuse existing `Button`, typography, and motion patterns from sibling landing sections; avoid a new card-grid pillar layout.

---

## Copy principles

- Honest: show real thresholds (5 / 6 / 7 for practice fresher / sde1 / senior).
- No jargon dump — “Pass bar”, “Tries left”, “Coached advance” over raw enum spam (enums OK in badge).
- Teach-forward tip grounded in TinyURL requirements (e.g. clarify functional vs non-functional; don’t dump a full solution).

---

## Success criteria

1. Logged-out `/` shows the section; logged-in does not.
2. Fresher + score 5 → first submit → `pass`.
3. Senior + score 5 → attempt 1 `retry`, attempt 2 `teach_forward`.
4. SDE-1 + score 5 → three retries then `teach_forward` on 3rd when score never meets 6.
5. No hydration mismatch (no `Date.now()` / locale clocks in initial HTML).
6. Unit tests cover pure orchestration paths above.

---

## Out of scope / later

- Logged-in dogfood variant.
- Practice vs Mock toggle.
- Autoplay scripted chat without clicks.
- Deep-linking from demo into a real flagged session.
