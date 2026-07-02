# Flag-Gated Feature Launch — Plan Index

> Spec: [2026-07-01-flag-gated-feature-launch-design.md](../specs/2026-07-01-flag-gated-feature-launch-design.md)

Four plans implement the spec. Execute in this order (B can start in parallel with A; C after A; D after A and C).

| Plan | File | Feature(s) | Flag key(s) | Depends on |
|---|---|---|---|---|
| A | [plan-a-flag-engine-and-lifetime](2026-07-01-plan-a-flag-engine-and-lifetime.md) | Flag engine, admin flags UI, Lifetime plan + Razorpay | `lifetimePlan` (engine itself unflagged) | — |
| B | [plan-b-fresher-track](2026-07-01-plan-b-fresher-track.md) | Fresher track + dual-ICP landing | `fresherTrack` | Tasks 1–3 none; Tasks 4–6 need A (Tasks 1–5) |
| C | [plan-c-interview-mode-and-probe](2026-07-01-plan-c-interview-mode-and-probe.md) | Timed interview mode; AI probe interviewer | `interviewMode`, `aiProbe` | A |
| D | [plan-d-voice-interview](2026-07-01-plan-d-voice-interview.md) | Turn-based voice interview | `voiceInterview` | A; loose-couples to C's session (nullable id) |

## Shared conventions (all plans)

- **Gating:** every UI entry point AND every API route/server action checks `canAccessFeature(userId, key)` from `@/lib/feature-flags-server` (Plan A Task 5). Never read `prisma.featureFlag` from feature code.
- **Dark by default:** all flags seed `enabledPlans: []`. Dark = byte-identical UI + 403 on direct API calls; each plan appends its dark tests to `e2e/flag-gating.spec.ts` (pattern set in Plan A Task 10).
- **E2E flag helpers:** plan-level state → `setFeatureFlagStateForE2e(key, enabledPlans)` in `scripts/seed-e2e.ts` (Plan B Task 6); per-user overrides → `grantFlagToE2eUser` / `removeFlagOverrideForE2eUser` in `e2e/helpers/flags.ts` (Plan C Task 10). Later plans reuse these — do not write new inline override helpers (Plan D Task 8 has a coordination note).
- **Playwright config:** each plan extends the authenticated project's `testMatch`; merge conflicts there are expected and trivial.
- **Serial e2e:** specs that mutate the shared e2e user's overrides run with `--workers=1` (CI already does).

## Build-schedule mapping (from spec §4)

- Day 1–2: A Tasks 1–7 ∥ B Tasks 1–3 (then B 4–6 once A Tasks 1–5 merge)
- Day 3: A Tasks 8–10 ∥ C Tasks 1–4
- Day 4: C Tasks 5–11
- Day 5: integration — full `npx vitest run && npx playwright test`, seed flags dark, regression fixes
- Days 6–10 (cycle 2): D Tasks 1–8
