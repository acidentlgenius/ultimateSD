# V2 Production Readiness Checklist
**Last updated:** 2026-07-10  
**Purpose:** Gate before enabling V2 flag for real users

---

## Tier 1 — Blocking (must pass before any user enables V2)

### Functional
- [ ] All 7 stages render without errors for `design-youtube` (the reference problem)
- [ ] Camera pans to correct region for all 7 stages
- [ ] All canvas regions display correct per-problem data (not generic text)
- [ ] Guide rail shows correct tips + suggestions for all stages
- [ ] Step explanation card renders and dismisses correctly
- [ ] Seniority picker works (FR suggestions change)
- [ ] Timer runs, pauses, and persists correctly
- [ ] "Read my canvas" returns feedback (static fallback acceptable for initial launch)
- [ ] Canvas content saves on blur and restores on reload
- [ ] Feature flag OFF → V1 renders unaffected
- [ ] Feature flag ON → V2 renders
- [ ] Mobile (<768px) → V1 renders even with flag ON

### TypeScript
- [ ] `npx tsc --noEmit` → zero errors
- [ ] No `any` types in new V2 code (except where explicitly noted)

### Tests
- [ ] `getCanvasData` returns correct data for all 40+ problem slugs
- [ ] `useCamera` returns correct transform for edge cases (very small viewport, very large)
- [ ] V1 tests (`pnpm test`) still pass

---

## Tier 2 — Required before broader rollout (1 week post-launch)

### Per-problem data completeness
- [ ] YouTube: full (spec has complete data)
- [ ] TinyURL: full
- [ ] Twitter: full
- [ ] Uber: full
- [ ] WhatsApp: full
- [ ] Rate Limiter: full
- [ ] Netflix: entities + HLD + deep dives defined
- [ ] Instagram: entities + HLD + deep dives defined
- [ ] Google Search: entities + HLD + deep dives defined
- [ ] Dropbox: entities + HLD + deep dives defined
- [ ] All remaining problems: at minimum FR, NFR, and guide data defined (entities/HLD can be stub)

### AI Integration
- [ ] `POST /api/ai/canvas-feedback` returns real AI response (not just static data)
- [ ] AI prompt produces useful, specific feedback (not generic)
- [ ] Feedback latency < 3s p95
- [ ] Graceful fallback to static feedback on AI error

### Persistence
- [ ] canvasSnapshot saves to DB on stage advance
- [ ] canvasSnapshot restores on page reload (localStorage + DB reconciliation)
- [ ] No data loss on browser close mid-session
- [ ] DB migration runs cleanly in staging

### Performance
- [ ] Canvas renders in < 100ms (paint, not full hydration)
- [ ] Camera transition is smooth at 60fps (no jank from layout thrashing)
- [ ] Dot grid does not cause repaints on scroll/pan
- [ ] Guide rail feedback request does not block UI

---

## Tier 3 — Nice to Have (post-launch improvements)

### UX Polish
- [ ] Free-draw tool (Excalidraw-style canvas drawing) — currently cosmetic mock
- [ ] HLD component labels are editable (double-click)
- [ ] Entity cards can have fields added/removed
- [ ] Deep dive circles can be repositioned by dragging
- [ ] Keyboard shortcut `Space` pauses timer when not in text area

### Observability
- [ ] Analytics event fired on each stage advance (`sd-v2-stage-advance { stage, problemSlug, secondsSpent }`)
- [ ] Analytics event on "Read my canvas" click
- [ ] Analytics event on seniority change
- [ ] Error boundary wraps CanvasSessionUI — error falls back to V1

### Accessibility
- [ ] All interactive elements have `aria-label`
- [ ] Bottom dock ticks have `title` attribute (already in design)
- [ ] Stage explanation card is a proper dialog (aria-modal, focus trap)
- [ ] Timer accessible with screen reader

---

## Rollout Strategy

### Phase A: Internal (Day 0)
Enable for: team members (via user IDs in feature flag)  
Goal: Verify no breaking bugs in production env

### Phase B: Beta (Day 3–5)
Enable for: 5% of new signups  
Monitor:
- V2 render error rate (target: < 0.1%)
- V1 usage unchanged (no regressions)
- Canvas feedback API latency
- canvasSnapshot save success rate

### Phase C: General (Day 7–14)
Enable for: all users who visit `/practice/[slug]`  
V1 accessible via explicit `?v1=true` query param for regression testing

### Phase D: V1 Removal (TBD)
After 30 days of V2 stability, V1 code can be deprecated (behind flag) but NOT deleted until 60 days of V2 data.

---

## Monitoring Signals

Track these metrics in PostHog/analytics:

| Signal | Healthy | Alert |
|---|---|---|
| V2 render error rate | < 0.1% | > 0.5% |
| Canvas feedback API p95 latency | < 3s | > 8s |
| Stage 5 (HLD) completion rate | > 40% (of sessions that reach stage 3) | < 20% |
| canvasSnapshot save failures | 0% | > 1% |
| Session time on stage 5 (HLD) | 10–20 min | < 3 min (not engaging) |
| Mobile V1 fallback rate | tracks with mobile traffic % | sudden change |

---

## Rollback Plan

If V2 causes issues:
1. Disable `problemFlowV2` feature flag in admin panel — all users immediately get V1
2. No code changes needed (feature flag is the only connection)
3. V1 code is untouched and will always work

Database: The `canvasSnapshot` column is nullable — removing it later is a safe migration.
