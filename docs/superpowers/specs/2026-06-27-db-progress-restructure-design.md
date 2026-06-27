# DB Progress Restructure — Design Spec

**Date:** 2026-06-27  
**Status:** Approved (sections 1–4)  
**Goal:** Fix poor progress visibility — attempted questions, status on dashboard, and full drill-down for solved sessions.

---

## Problem Statement

The app uses Prisma + PostgreSQL but progress data is fragmented across three sources (localStorage, `ProblemProgress.sessionState` JSON, and `ProblemProgress.completedStepIds`). Users cannot reliably see:

- Which questions they have **attempted**
- **Status** of each question on the dashboard
- **Full details** of solved questions (answers, feedback, scores per step)

Additional gaps:

- Dashboard renders raw `PROBLEMS` without merging DB progress
- Only **passing** step submissions are persisted
- `progressPercent` is never computed
- `REVIEW_NEEDED` status is defined but never set
- No versioned migrations (`db push` only)
- Cloud sync gated to premium/BYOK users

---

## Requirements (User-Confirmed)

| Requirement | Decision |
|-------------|----------|
| History + drill-down detail view | **Both** — profile list + `/profile/history/[sessionId]` page |
| Failed attempt storage | **All non-empty submissions** (pass and fail); skip blank content |
| Architecture approach | **Phased hybrid** — quick visibility wins in Phase 1, session model in Phase 1 schema |

---

## Section 1: Schema

### New Prisma Enums

```prisma
enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  REVIEW_NEEDED
  COMPLETED
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  ABANDONED
}
```

### New Model — `PracticeSession`

| Field | Type | Purpose |
|-------|------|---------|
| `id` | String @id @default(cuid()) | Primary key |
| `userId` | String | FK → User |
| `problemId` | String | Matches static problem id |
| `status` | SessionStatus | ACTIVE \| COMPLETED \| ABANDONED |
| `startedAt` | DateTime | Session start |
| `completedAt` | DateTime? | When all steps passed |
| `finalScore` | Int? | Aggregate score at completion |
| `diagramSnapshot` | Json? | Excalidraw state at completion |
| `isTimerRunning` | Boolean @default(true) | Timer state (moved from ProblemProgress) |
| `lastPausedAt` | DateTime? | Timer pause timestamp |
| `totalPausedSeconds` | Int @default(0) | Accumulated pause time |
| `attemptNumber` | Int | 1-based attempt count for this user+problem |

Relations: `user User`, `submissions StepSubmission[]`

Indexes: `@@index([userId, problemId])`, `@@index([userId, status])`

### Updated Model — `StepSubmission`

Add fields:

| Field | Type | Purpose |
|-------|------|---------|
| `sessionId` | String | FK → PracticeSession (required after migration) |
| `phase` | String | e.g. `requirements`, `hld`, `lld`, `tradeoffs`, `scalability` |

Keep existing: `content`, `feedback`, `score`, `isPassing`, `createdAt`

### Updated Model — `ProblemProgress` (summary row)

| Field | Change |
|-------|--------|
| `status` | Change to `ProgressStatus` enum |
| `progressPercent` | **Add** Int @default(0) — 0–100 |
| `totalAttempts` | **Add** Int @default(0) — count of sessions started |
| `bestScore` | **Add** Int? — highest finalScore across sessions |
| `activeSessionId` | **Add** String? — FK → PracticeSession |
| `sessionState` | **Remove** (Phase 3) |
| Timer fields | **Remove** — moved to PracticeSession |
| `attempts` | **Remove** — replaced by `totalAttempts` |
| `updatedAt` | Fix to `DateTime @updatedAt` (non-optional) |

Keep: `lastScore`, `completedStepIds`, `nextRepetitionDate`, `startedAt`, `lastAttemptAt`, `currentStep`

### Ops

- Add first Prisma migration: `prisma/migrations/20250627_progress_restructure/`
- Backfill script: `scripts/migrate-progress-sessions.ts`

---

## Section 2: Data Flow & Server Layer

### Write Path

```
startPracticeSession(problemId)
  → upsert ProblemProgress (IN_PROGRESS)
  → create or resume PracticeSession (ACTIVE)
  → set activeSessionId

recordStepSubmission(sessionId, stepId, phase, content, feedback, score, isPassing)
  → skip if content.trim() is empty
  → create StepSubmission
  → update ProblemProgress summary (progressPercent, status)
  → if all steps passed → completeSession()

awardStepXp(problemId, stepId)  [refactored from completeStep]
  → XP/streak only on first pass of step in session

completeSession(sessionId, finalScore, diagramSnapshot)
  → PracticeSession → COMPLETED
  → ProblemProgress → COMPLETED, bestScore, nextRepetitionDate (+7 days)
  → User.completedProblems recount

abandonSession(problemId)
  → current ACTIVE session → ABANDONED
  → create new ACTIVE session, increment totalAttempts
```

All multi-step writes use `prisma.$transaction`.

### Read Path

| Helper | Used By |
|--------|---------|
| `getUserProgressMap()` | Home `/`, recommendations, dashboard merge |
| `getSessionDetail(sessionId)` | `/profile/history/[sessionId]` |
| `getActiveSession(problemId)` | Practice page restore |

### Status Derivation (`getUserProgressMap`)

| Condition | Status |
|-----------|--------|
| No sessions | NOT_STARTED |
| ACTIVE session, partial progress | IN_PROGRESS |
| Latest session COMPLETED | COMPLETED |
| COMPLETED + nextRepetitionDate ≤ now | REVIEW_NEEDED (promoted on read) |
| All sessions ABANDONED, none completed | IN_PROGRESS |

`progressPercent` = unique passed stepIds in active/latest session / total steps for problem × 100.

### localStorage Role

| User | Behavior |
|------|----------|
| Logged in | Draft buffer only; **DB wins** on page load |
| Logged out | localStorage only (unchanged) |
| Premium gate on sync | **Removed** — all authenticated users get DB persistence |

### Server Action File Structure

Split `src/app/actions/progress.ts` into:

- `src/app/actions/progress/sessions.ts` — start, abandon, complete
- `src/app/actions/progress/submissions.ts` — record, get history
- `src/app/actions/progress/summary.ts` — getUserProgressMap, status derivation
- `src/app/actions/progress/index.ts` — re-exports for backward compat

### Migration Strategy (Existing Data)

1. For each `ProblemProgress` where `status != NOT_STARTED`, create a `PracticeSession`.
2. Link existing `StepSubmission` rows via `sessionId`.
3. Set `activeSessionId` for IN_PROGRESS rows.
4. Compute `progressPercent` from `completedStepIds`.
5. Drop `sessionState` column in Phase 3.

---

## Section 3: UI Changes

### Dashboard (`/`)

- `page.tsx` calls `getUserProgressMap()` and merges into problems
- `ProblemFilterBar` adds status filter: All · Not Started · Attempted · In Progress · Completed · Review Due
- `ProblemCard` shows status badge, progress bar, optional attempt count
- List view adds Status and Progress columns

### Profile (`/profile`)

- `HistoryList`: group by problem, show multiple sessions, link completed → detail page
- Filter tabs: All · In Progress · Completed · Review Due
- Fix broken `/dashboard` link → `/`

### Session Detail Page (new)

**Route:** `/profile/history/[sessionId]`

**Components:**
- `src/app/profile/history/[sessionId]/page.tsx` — server component
- `src/components/profile/SessionPhaseReview.tsx` — phase tabs + step cards
- `src/components/profile/StepAttemptCard.tsx` — answer, feedback, score, expandable failed attempts
- `src/components/profile/DiagramSnapshotViewer.tsx` — read-only Excalidraw

**Auth:** Session must belong to logged-in user.

### Practice Flow (`StepByStepChat`)

- Load active session + submissions from DB on mount
- Call `recordStepSubmission` on every evaluation (pass or fail)
- Call `completeSession` when all steps pass (include diagram snapshot)
- "Start Over" calls `abandonSession`
- Footer: "Saved to account" for logged-in users

### Types (`src/types/index.ts`)

```typescript
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW_NEEDED';

export interface ProblemWithStatus extends SystemDesignProblem {
  status?: ProgressStatus;
  progress?: number;
  lastPracticed?: Date;
  nextRepetitionDate?: Date;
  totalAttempts?: number;
  bestScore?: number;
}

export interface SessionDetail {
  id: string;
  problemTitle: string;
  problemSlug: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startedAt: Date;
  completedAt?: Date;
  finalScore?: number;
  attemptNumber: number;
  diagramSnapshot?: unknown;
  phases: PhaseSubmissionGroup[];
}

export interface PhaseSubmissionGroup {
  phase: string;
  phaseLabel: string;
  steps: StepSubmissionDetail[];
}

export interface StepSubmissionDetail {
  stepId: string;
  stepTitle: string;
  attempts: {
    id: string;
    content: string;
    feedback: ParsedFeedback | null;
    score: number | null;
    isPassing: boolean;
    createdAt: Date;
  }[];
}
```

---

## Section 4: Error Handling, Testing & Rollout

### Error Handling

| Scenario | Behavior |
|----------|----------|
| DB write fails | Return `{ success: false }`; keep localStorage draft; toast + silent retry |
| Offline evaluation | Queue in memory; retry on reconnect |
| Wrong user's session | 404 / redirect to `/profile` |
| Orphan submissions in migration | Synthetic COMPLETED session created; log count |
| Empty content | Skip DB write |
| Two tabs open | `activeSessionId` authoritative; banner to take over |
| REVIEW_NEEDED | Promoted on read when SRS date passed |

### Testing

| File | Coverage |
|------|----------|
| `src/app/actions/__tests__/progress.test.ts` | Status derivation, recordStepSubmission, session lifecycle |
| `src/app/page.test.tsx` | Dashboard status merge for logged-in user |
| `src/app/profile/history/[sessionId]/page.test.tsx` | Detail page render + auth |
| `scripts/migrate-progress-sessions.test.ts` | Backfill logic |

Quality gate: `pnpm lint && pnpm test run && pnpm build`

### Rollout Phases

**Phase 1 — Foundation**
- Schema migration + backfill script
- New server actions (record, sessions, summary)
- Refactor StepByStepChat write path
- Dashboard status merge

**Phase 2 — Read Surfaces**
- Profile history enhancements
- Session detail page
- Fix broken links

**Phase 3 — Cleanup**
- Remove sessionState, syncSessionState, getSavedSessionState
- Remove premium gate on progress sync
- Update SESSION_PERSISTENCE.md

Each phase is independently deployable.

---

## Out of Scope

- Storing problems in the database (remain static in `problems.ts`)
- Roadmap progress integration (hardcoded locked/unlocked)
- REST API routes for progress (server actions only)
- Real cron job for REVIEW_NEEDED (promoted on read instead)

---

## Key Files Reference

| Purpose | Path |
|---------|------|
| Schema | `ultimate-sd/prisma/schema.prisma` |
| Progress actions | `ultimate-sd/src/app/actions/progress/` |
| Dashboard | `ultimate-sd/src/app/page.tsx`, `DashboardClient.tsx` |
| Profile | `ultimate-sd/src/app/profile/page.tsx`, `HistoryList.tsx` |
| Detail page | `ultimate-sd/src/app/profile/history/[sessionId]/page.tsx` |
| Practice writes | `ultimate-sd/src/components/StepByStepChat.tsx` |
| Types | `ultimate-sd/src/types/index.ts` |
| Migration script | `ultimate-sd/scripts/migrate-progress-sessions.ts` |
