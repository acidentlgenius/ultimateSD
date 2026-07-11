---
name: feedback-spec-gap
description: Previous V2 plans failed because they were too abstract — spec must be pixel-exact with per-problem data
metadata:
  type: feedback
---

# Spec Gap Failure Pattern

## Rule
V2 specs and plans must be pixel-exact with per-problem data, or implementation will drift back to V1 forms.

**Why:** The previous spec described the canvas design conceptually ("infinite canvas", "handwriting style", "7 stages") but didn't specify:
- Exact CSS values (colors, font sizes, border-radius, rotation degrees)
- Exact positions of each canvas region (left, top, width, height in canvas coordinates)
- Per-problem data (what entities, what HLD components, what API endpoints for each of 40+ problems)
- The camera transform formula
- The contentEditable approach for editability

**Result:** Developer saw "infinite canvas" and fell back to the existing step-by-step form approach because it was easier to implement.

## How to Apply
- New spec is at `docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md` — it has all the above
- Whenever V2 is described in a prompt, link to this spec, not to a summary
- If implementing a V2 component and something is unclear: check spec → check prototype HTML → ask; never guess
- Any deviation from spec must be documented in `memory/recent-changes.md` with the reason

## Checklist for a good spec
- [ ] Exact CSS token values (not "dark blue")
- [ ] Exact pixel positions for all absolutely-positioned elements
- [ ] Per-problem data for at least the 6 most popular problems
- [ ] TypeScript interface definitions
- [ ] Camera transform formula
- [ ] State machine for all interactive elements
- [ ] Feature flag integration point

**Verified:** 2026-07-10 — new spec meets all checklist items.
