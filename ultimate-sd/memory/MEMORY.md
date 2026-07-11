# Memory Index — Ultimate SD Project
**Format:** Each line links to a memory file and gives a one-line summary.  
**Rule:** Keep this file under 60 entries. Memory files live in `memory/`.  
**Updated by:** any agent session that learns something worth persisting.

---

## Project Context
- [V2 Canvas Design](project-v2-canvas.md) — V2 is an infinite-canvas whiteboard replacing the form-based V1 practice UI; feature-flagged behind `problemFlowV2`
- [Platform Architecture](project-platform-arch.md) — Next.js 14 app router, Prisma + Neon, pnpm, Turbopack dev, auth via next-auth

## Agent Feedback (what to do / avoid)
- [Spec Gap Failure](feedback-spec-gap.md) — previous V2 plans failed because they were too abstract; spec must be pixel-exact with per-problem data
- [Implementation Drift](feedback-implementation-drift.md) — without guard rails, implementation drifts back to V1 form approach; use feature flag as boundary
- [Data First Rule](feedback-data-first.md) — V2 requires per-problem canvas data before any UI; never implement a region with generic placeholders

## Technical Decisions
- [Canvas Transform Approach](tech-camera-transform.md) — camera panning uses CSS `scale(s) translate(-tx, -ty)` on a 3200×1700 wrapper, NOT individual region repositioning
- [ContentEditable Choice](tech-contenteditable.md) — editable canvas areas use `contentEditable` + `onBlur` (not controlled inputs) to preserve Caveat font styling

## Session Audit
- [Recent Changes](recent-changes.md) — all file changes across sessions, most recent at top
