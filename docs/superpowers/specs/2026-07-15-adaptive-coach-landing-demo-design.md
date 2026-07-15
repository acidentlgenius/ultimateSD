# Adaptive Coach Landing Demo — Design

> **Status:** Implemented v2 (2026-07-15) — autoplay coach replay  
> **Spec version:** v2.0  
> **App root:** `ultimate-sd/`  
> **Related:** `docs/superpowers/specs/2026-07-14-adaptive-coach-skills-design.md`

---

## Problem

v1 exposed Adaptive Coach as a click-through policy calculator (score 5, Pass bar, identical retries). It taught the gate, not the product — felt fake on the landing page.

---

## Goals

1. Logged-out landing shows a **realistic autoplay coach chat** (~10–20s).
2. Level pills (Fresher / SDE-1 / Senior) **restart** the clip; endings fork by level.
3. Feels like practice chat (You / Coach), not Pass bar / Tries / score chrome.
4. No LLM / API for guests.

## Non-goals

- Live `progressGate` in the UI (policy remains product-backed; demo is authored narrative aligned with fresher-pass / mid-retry-teach / senior-probe-teach).
- Editable answer / real submit path on the marketing strip.
- Logged-in variant.

---

## UX (v2)

- Headline: “Same rough answer. A coach that fits you.”
- Autoplay transcript; Pause / Replay.
- Shared opening (system → you draft → coach FR/NFR nudge).
- Forked endings:
  - Fresher: enough-to-start → data model
  - SDE-1: revised try → still thin → unlock with one tip → data model
  - Senior: higher-bar probe → hand-wavy → dignified tip + advance
- Quiet footer: “Demo · Adaptive Coach” + Start practicing → `/practice/design-tinyurl`
- `prefers-reduced-motion`: show full script immediately.

---

## Files

- `ultimate-sd/src/lib/adaptive-coach/demo/landing-demo.ts` — scripts + `visibleBeats`
- `ultimate-sd/src/components/landing/AdaptiveCoachDemo.tsx` — player UI
- Mounted in `DashboardClient` when `!user`
