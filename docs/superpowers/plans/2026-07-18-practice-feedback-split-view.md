# Practice Feedback Split View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the practice feedback modal with a left locked-answer / right feedback split after submit.

**Architecture:** Extract a presentational `StepFeedbackPanel` from the modal body. `StepByStepChat` enters `showFeedback` review mode that renders a two-column (stacked on mobile) layout; Try Again clears review back to edit.

**Tech Stack:** React, Tailwind, existing shadcn Button/Card, Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-07-18-practice-feedback-split-view-design.md`

## Global Constraints

- No modal on the primary practice submit → review path
- Next/Continue still gated by `isStepCompletable` / `canAdvancePastStep`
- Do not change coach turn API or progress-gate thresholds
- Keep changes surgical inside practice UI components

---

### Task 1: StepFeedbackPanel

**Files:**
- Create: `ultimate-sd/src/components/StepFeedbackPanel.tsx`
- Test: `ultimate-sd/src/components/__tests__/StepFeedbackPanel.test.tsx`

**Interfaces:**
- Produces: `StepFeedbackPanel` with props `{ feedback, tip?, gate?, canAdvance, xpEarned?, probeEntitled, onTryAgain, onContinue, onStartProbe }`
- Does **not** render `userAnswer` (left pane owns that)

- [ ] **Step 1:** Write tests for score title, Try Again vs Continue labels, strengths list
- [ ] **Step 2:** Implement compact panel (score, accuracy bar, strengths/weaknesses/missed, tip, actions)
- [ ] **Step 3:** Call `updateStreak` on mount when `feedback.isAcceptable` (same as modal)
- [ ] **Step 4:** Run `npx vitest run src/components/__tests__/StepFeedbackPanel.test.tsx`

### Task 2: Wire split review into StepByStepChat

**Files:**
- Modify: `ultimate-sd/src/components/StepByStepChat.tsx`
- Modify: diagramBeside branch + main Card branch

- [ ] **Step 1:** When `showFeedback && feedback`, render `md:grid-cols-2`: left locked submission + right `StepFeedbackPanel`
- [ ] **Step 2:** Locked left: list rows without edit/delete; textarea/schema read-only; header “Your submission” + Edit answer
- [ ] **Step 3:** Remove `FeedbackModal` usage from practice path (`onTryAgain` → `setShowFeedback(false)`; `onContinue` → `handleNext`)
- [ ] **Step 4:** Mobile stacks; diagramBeside uses same review split/stack

### Task 3: Verify

- [ ] Run FeedbackModal + StepFeedbackPanel + step-resume tests
- [ ] Manual: submit list → split visible; Try Again → edit; fail → no Continue

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Split after submit | 2 |
| No modal primary path | 2 |
| Edit / Try Again | 2 |
| Continue gated | 2 (existing `isStepCompletable`) |
| Mobile stack | 2 |
| Coach same path | 2 |
