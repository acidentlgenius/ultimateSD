---
name: practice-path-debug
description: Systematically diagnose and fix user-facing issues on the practice session path (chat, evaluation, diagram, session persistence) without breaking its load-bearing invariants — use for bug reports like "lost my work", "wrong score", "stuck step", "diagram disappeared"
---

# Debugging the practice path

The practice session is the product's critical path:
`practice/[slug]/page.tsx` (server gate) → `PracticeUI` (owner of session + timer) →
`StepByStepChat` (steps + evaluation) + `DiagramCanvas` (Excalidraw persistence) +
`HelpAssistant`. Most user-facing bugs land in one of four buckets below — identify the bucket
first, then respect its invariants. History shows fixes here regress easily.

## Bucket 1: "My diagram disappeared / came back after I deleted it"

`DiagramCanvas.tsx` + `src/lib/diagram-persistence.ts`. Non-negotiable invariants:

- **Never trust a live-empty API read.** During step navigation the flush runs after the keyed
  Excalidraw child unmounted; its dead API reports an empty scene while the user's content is
  real. `resolveSceneForPersist` must only return the live scene when it has elements; empties
  flow through `pendingSceneRef`.
- **`hasHydratedRef` gates empty persistence.** Emptiness counts as a deliberate delete-all
  ONLY after content has been OBSERVED (onChange with elements > 0) or there was nothing to
  restore. A merely *attempted* restore is not hydration — a failed restore must never wipe
  the save.
- Excalidraw fires empty onChange events during mount; `isRestoringRef` + the debounce guards
  exist for that window. Don't "simplify" the guard web without e2e coverage.

Debug with `[diagram]` console events (`diagram-debug.ts`, on in dev). The wipe signature is
`persist:cleared-empty` with the wrong stepKey/timing. Regression tests:
`src/components/__tests__/DiagramCanvas.test.tsx` (incl. delete-all persistence).

## Bucket 2: "Wrong score / told I failed / stuck on a step"

- An AI/provider failure must NEVER look like a failing answer. `/api/ai/evaluate` returns real
  error statuses (403 access / 429 rate-limit / 502 malformed) — never HTTP 200 with
  `score: 0`. Model JSON is Zod-validated (`FeedbackSchema`) with one corrective retry; nothing
  is persisted on failure. Client shows the amber "We couldn't grade your answer" banner
  (`evaluationError` state), NOT red feedback.
- `fetchWithRetry` (fetchUtils.ts) retries only 429/408/5xx/network; `HttpError.serverMessage`
  carries user-facing copy from `{error, message}` bodies — keep that response shape on all AI
  routes. Never leak raw `error.message` from a route catch (internal details).
- Stuck progression usually means `isAcceptable` never became true for the step — check the
  latest submission's stored feedback JSON, not the UI.

## Bucket 3: "Lost my place / duplicate sessions / weird attempt counts"

- `PracticeUI` is the SINGLE owner of `startPracticeSession`; `StepByStepChat` waits for the
  `sessionInit` prop. Never add another mount-time call. The server action re-checks for an
  active session inside its transaction.
- Resume position: `src/lib/step-resume.ts` — resume AFTER the furthest completed step; skipped
  steps become the target only when everything beyond them is done. Tests in
  `src/lib/__tests__/step-resume.test.ts`.
- Guests draft to localStorage (`session-storage.ts`); signed-in users reconstruct from DB
  submissions. Guard all date parsing — legacy records may lack `lastUpdated`.

## Bucket 4: Crashes / blank screens

Boundaries exist at three levels: `app/error.tsx` + `app/global-error.tsx`,
`app/practice/[slug]/error.tsx` ("your progress is saved" copy), and the component
`ErrorBoundary` isolating DiagramCanvas. A crash fix should identify WHY the throw happened,
but the boundary must have caught it — if the user saw a blank page, that's a second bug.

## Reproduction & verification recipe

1. Free problems (no plan needed): tinyurl, parking-lot, elevator-system, unique-id-generator,
   typeahead-suggestion, distributed-cache, dropbox, whatsapp. E2E user: `test@e2e.sysdesignai.local`
   (seed via `npx tsx scripts/seed-e2e.ts`). **Login is required for all practice — no guest
   sessions, by product decision.**
2. Drive the app with the `verify` skill. Reset a problem's server state by deleting its
   `stepSubmission`/`practiceSession`/`problemProgress` rows for the e2e user.
3. Port 3000 may be occupied by an unrelated app on this machine — run Playwright with
   `PORT=3901 npx playwright test <spec> --project=authenticated`.
4. Any e2e spec driving `/practice/*` must call `suppressFirstRunUx(page)`
   (`e2e/helpers/first-run.ts`) or the first-run tour overlay blocks all clicks.
5. Before declaring fixed: `npx vitest run` (322+ tests), `npx tsc --noEmit`, and re-drive the
   original repro live. For diagram fixes, always test the step-nav round trip
   (draw → navigate away → back → refresh), not just refresh.
