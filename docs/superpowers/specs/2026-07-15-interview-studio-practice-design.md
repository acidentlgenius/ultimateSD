# Interview Studio Practice Redesign — Design

> **Status:** Approved for implementation (2026-07-15) — direction fixed from practice UX exploration  
> **Spec version:** v1.0  
> **App root:** `ultimate-sd/`  
> **Related:** Adaptive coach skills + landing demo AdaptiveCoachDemo chat dialect

---

## Problem

Live `/practice/*` mixes marketing gradients (HelpAssistant), a flyout step menu, heavy FeedbackModal celebrations, dual StepByStepChat layouts, and missing CSS utilities. The product already has calm workspace bones in `PracticeUI`, `ProblemIntroStep`, and `AdaptiveCoachDemo`.

---

## Goals

1. One visual dialect in practice: primary user actions, bordered coach bubbles, no purple marketing gradients.
2. Persistent desktop step rail (~240px); mobile keeps Sheet.
3. Calm feedback motion; celebrate only in `CompletionUI`.
4. Fix token debt (Geist wiring, missing `.gradient-bg` or replace with Button default).
5. Extract shared `CoachBubble` from landing demo; restyle Help as Sheet/header entry.

## Non-goals

- Wiring `/api/ai/coach/turn` or Flow V2 live agenda.
- Landing / marketing redesign.
- Changing coach gate policy thresholds.

---

## Decisions

| Topic | Decision |
|-------|----------|
| Chat primitive | Extract `CoachBubble` from AdaptiveCoachDemo into `components/chat/CoachBubble.tsx` |
| Help | Header ghost “Hint” → right Sheet; drop fixed purple FAB |
| Step nav | Desktop: fixed left rail; Mobile: existing Sheet |
| Feedback | Soften confetti/scale on step submit; tip already in modal (Phase B) |
| Tokens | Wire `--font-geist-sans` into `@theme`; define `.gradient-bg` as primary solid/soft gradient |

---

## Implementation slices

1. D1 — Token debt (`globals.css` / theme)
2. D2 — `CoachBubble` + HelpAssistant Sheet
3. D3 — Persistent desktop rail in PracticeUI
4. D4 — Calm FeedbackModal (no confetti on every score)
5. D5 — Shared prompt chrome between diagramBeside and card modes (minimal shared wrapper classes)

---

## Success criteria

- Practice surfaces use token colors; Help is not a purple FAB.
- Desktop shows a persistent step list without opening a flyout.
- FeedbackModal does not fire confetti on teach_forward / keep-practicing.
- `pnpm lint` / targeted tests pass for touched files.
