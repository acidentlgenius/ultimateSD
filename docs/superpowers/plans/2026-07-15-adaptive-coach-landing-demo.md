# Adaptive Coach Landing Demo Implementation Plan (v2)

> **Status:** Implemented (autoplay coach replay)  
> **Spec:** `docs/superpowers/specs/2026-07-15-adaptive-coach-landing-demo-design.md` (v2.0)

**Goal:** Logged-out landing shows a realistic ~10–20s autoplay Adaptive Coach chat. Level pills (Fresher / SDE-1 / Senior) restart the clip; endings fork by level. Feels like practice chat (You / Coach), not a Pass-bar calculator.

**Architecture:** Authored beat scripts in `landing-demo.ts` (`getDemoScript`, `visibleBeats`, `scriptDurationMs`). `AdaptiveCoachDemo` is a presentational autoplay player. `DashboardClient` mounts it only when `!user`, between FeatureShowcase and AiInterviewerSection. No LLM, no API, no live `progressGate` in the marketing strip.

**Tech Stack:** Next.js App Router client components, Framer Motion, Vitest, Lucide icons, shadcn `Button` / `Badge`. App root `ultimate-sd/`.

## Global Constraints

- Levels: `fresher` | `sde1` | `senior` only (label SDE-1 for `sde1`).
- Shared opening → forked endings (fresher pass-style; sde1 retry then teach-forward; senior probe then teach-forward).
- `prefers-reduced-motion`: show full script immediately.
- Section logged-out only; not gated behind `adaptiveCoach`.
- CTA: Start practicing → `/practice/design-tinyurl`.
- Paths relative to `ultimate-sd/` unless noted (`docs/` stays repo-root).

## File map

| Path | Responsibility |
|------|----------------|
| `src/lib/adaptive-coach/demo/landing-demo.ts` | Scripts, `DemoBeat`, `getDemoScript`, `visibleBeats`, `scriptDurationMs` |
| `src/lib/adaptive-coach/demo/__tests__/landing-demo.test.ts` | Script fork + timeline tests |
| `src/components/landing/AdaptiveCoachDemo.tsx` | Autoplay player UI (Pause / Replay, level pills) |
| `src/components/landing/DashboardClient.tsx` | Mount `{!user && <AdaptiveCoachDemo />}` |

## Tasks (completed)

1. Authored scripts + pure helpers + unit tests  
2. `AdaptiveCoachDemo` autoplay UI  
3. Wire into logged-out `DashboardClient`; mark design spec Implemented v2  

## Verification

```bash
pnpm test run src/lib/adaptive-coach/demo/__tests__/landing-demo.test.ts
```

Manual: logged-out `/` — section after Feature Showcase; pills restart clip; Pause/Replay; CTA path; logged-in section absent.
