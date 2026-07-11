---
name: feedback-data-first
description: V2 requires per-problem canvas data BEFORE any UI — never implement a region with generic placeholders
metadata:
  type: feedback
---

# Data First Rule

## Rule
Never implement a V2 canvas region that renders generic placeholder text. Every problem must have real `ProblemCanvasData` before that region is considered done.

**Why:** The whole point of V2 is that each problem has its own tailored experience — YouTube's HLD shows Upload service → CDN → Transcoder pool, not a generic "Service A → Database B". If a region shows generic data, V2 is no better than V1.

## How to Apply
- Phase 1 of the implementation plan is creating `canvas-data.ts` with real per-problem data
- Do NOT start Phase 2 (canvas shell) until at least 6 core problems have full data
- Use TypeScript's required fields to enforce completeness — the `ProblemCanvasData` interface has no optional sections
- For problems not yet specified, create a stub that TypeScript accepts, but mark it clearly with a `TODO: fill real data` comment and log a warning in dev

## Stub Pattern (acceptable temporary state)
```typescript
const INSTAGRAM_DATA: ProblemCanvasData = {
  slug: 'design-instagram',
  // TODO: fill real data per spec Section 8.X
  problem: { title: 'Design Instagram', context: '500M DAU, 1B photos/day...', scopeNote: 'In scope: photo upload, feed, follow. Out of scope: Stories, Reels.' },
  fr: { beginner: ['Upload a photo', 'View feed', 'Follow a user'], midLevel: ['Upload → CDN → feed', 'Photo feed generation', 'Follow graph'], senior: ['Upload → compress → CDN', 'Feed ranking', 'Follow at scale', 'Stories (stretch)'], outOfScope: ['Stories', 'Reels', 'DMs'] },
  // ... entities, api, hld etc. with real data from existing INSTAGRAM_STEPS in problem-steps.ts
};
```

The existing `INSTAGRAM_STEPS` in `src/lib/problem-steps.ts` contains enough content to bootstrap all problems' canvas data. Use it as a reference.

**Priority order for full data:** YouTube (done) → TinyURL (done) → Twitter (done) → Uber (done) → WhatsApp (done) → Rate Limiter (done) → Netflix → Instagram → Google Search → Dropbox → all others
