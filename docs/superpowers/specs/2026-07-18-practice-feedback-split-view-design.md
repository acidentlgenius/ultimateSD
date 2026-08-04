# Practice Step Feedback Split View — Design

> **Status:** Implemented v1 (2026-07-18)  
> **Spec version:** v1.0  
> **Date:** 2026-07-18  
> **App root:** `ultimate-sd/`  
> **Surfaces:** `StepByStepChat`, feedback UI (replace modal-primary path)

---

## Problem

After submit, feedback opens in a **modal**. The user’s answer sits behind the dialog, so they cannot easily compare **what they wrote** with **score / strengths / weaknesses / missed**. On retry they lose that side-by-side context.

## Goals

1. After submit, show a **two-pane review**: left = locked formatted answer, right = feedback.
2. **No modal** for the primary submit → review path (option A).
3. **Edit answer / Try Again** unlocks the left pane for another submit without leaving the step.
4. Preserve existing gate rules: Next locked until pass / coached advance / explicit Skip; Continue only when `isStepCompletable`.

## Non-goals

- Redesign Hint / History / Skip chrome.
- Change scoring, coach turn API, or progress-gate thresholds.
- New PDF export UX (keep optional later on the feedback pane if already wired).
- Full visual redesign of practice chrome outside this split.

---

## UX

### States

| State | Left | Right | Primary actions |
|-------|------|-------|-----------------|
| **Editing** (default / after Edit) | Editable inputs (list / textarea / schema) | Hidden or collapsed | Skip · Submit answer |
| **Review** (after submit) | Locked, formatted submission | Inline feedback panel | Edit answer / Try Again · Continue (if allowed) |

### Layout (desktop / tablet)

```
┌──────────────────────────┬───────────────────────────┐
│ Your submission (locked) │ Feedback                  │
│ · formatted answer       │ · score / accuracy / gate │
│ · Edit answer            │ · strengths / weak / miss │
│                          │ · tip (if teach_forward)  │
│                          │ · Try Again | Continue    │
└──────────────────────────┴───────────────────────────┘
```

- Left keeps the step prompt as a quiet eyebrow; title focus is “Your submission”.
- Right does **not** re-print the full answer (left already shows it).
- List answers render as the same row style as edit mode, without add/edit/delete controls.
- Textarea / schema: read-only formatted block.

### Layout (mobile)

- Stack vertically: answer card first, feedback second.
- Actions sticky at bottom of the feedback section (or shared footer): Edit / Continue.

### Actions

- **Edit answer** / **Try Again**: same effect — leave Review → Editing; keep last feedback visible in a compact “Last feedback” strip **or** collapse right until next submit (prefer: collapse right, restore full edit UI — simpler). **Decision:** collapse feedback pane; show full editable form again; previous feedback remains in `feedback` state for History / optional “View last feedback” if already present.
- **Continue to next step**: only when `isStepCompletable(feedback, gate)` (pass / teach_forward / advance_budget). Same as today’s modal `canAdvance`.
- Fail / retry gate: primary button is **Try Again** (not Continue).

### Diagram-beside / compact mode

- Same state machine. If width is tight, use the mobile stack inside the compact column.

---

## Interaction details

1. User submits → loading on Submit → enter **Review** with left locked + right filled from evaluate / coach turn response.
2. Streak / XP toasts stay as today (triggered on acceptable / awards), not dependent on modal open.
3. Keyboard: while in Review, do not treat the form as editable; arrow Next still gated by pass/skip rules.
4. Closing: there is no modal dismiss — leaving Review is Edit or Continue/Skip only.

---

## Component plan

| Piece | Change |
|-------|--------|
| `StepByStepChat` | Add `reviewMode` (or derive from `showFeedback`); render split layout; stop opening modal as primary. |
| New or extracted `StepFeedbackPanel` | Presentational feedback (score, lists, tip, actions) — logic from current `FeedbackModal` body. |
| `FeedbackModal` | Keep for now only if something else depends on it; practice path stops using it. Prefer delete usage from practice; deprecate modal later if unused. |
| Tests | Feedback panel shows submission on left + score on right; Try Again returns to edit; Continue gated. |

---

## Success criteria

- [ ] Submit on list step → split view; left shows all list items locked; right shows score.
- [ ] Try Again → editable list again; can re-submit.
- [ ] Score below threshold → no Continue (or Continue disabled / absent); Next header still locked.
- [ ] Pass → Continue advances step.
- [ ] Mobile: stacked panes, both readable without horizontal scroll.
- [ ] Adaptive coach path uses the same split (not a separate modal).

---

## Open questions (resolved)

| Question | Resolution |
|----------|------------|
| Modal vs inline on fail? | **A** — always inline split after submit |
| Duplicate answer on feedback pane? | No — left only |

---

## Self-review

- No placeholders / TBD left in success criteria.
- Scope limited to practice step review UI; coach/API untouched.
- Does not contradict Next-lock / Skip behavior from 2026-07-18 gate fix.
