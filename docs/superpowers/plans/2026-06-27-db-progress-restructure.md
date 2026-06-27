# DB Progress Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure progress persistence so users see attempted/in-progress/completed status on the dashboard and can drill into full session details (answers, feedback, scores).

**Architecture:** Introduce `PracticeSession` as the unit of attempt; `ProblemProgress` becomes a per-user+problem summary; all non-empty step submissions (pass or fail) persist to `StepSubmission`. Phased rollout: Phase 1 schema + writes + dashboard merge, Phase 2 profile/detail UI, Phase 3 cleanup of legacy `sessionState`.

**Tech Stack:** Next.js 16, Prisma 7, PostgreSQL, Vitest, existing server actions pattern in `src/app/actions/`

**Spec:** `docs/superpowers/specs/2026-06-27-db-progress-restructure-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `ultimate-sd/prisma/schema.prisma` | Enums, `PracticeSession`, updated models |
| `ultimate-sd/src/lib/progress-utils.ts` | Pure helpers: step counts, status derivation, progress % |
| `ultimate-sd/src/app/actions/progress/sessions.ts` | Session lifecycle + timer |
| `ultimate-sd/src/app/actions/progress/submissions.ts` | Record/fetch submissions |
| `ultimate-sd/src/app/actions/progress/summary.ts` | `getUserProgressMap`, `getSessionDetail`, `getActiveSession` |
| `ultimate-sd/src/app/actions/progress/index.ts` | Re-exports (backward compat) |
| `ultimate-sd/scripts/migrate-progress-sessions.ts` | Backfill existing data |
| `ultimate-sd/src/types/index.ts` | `ProgressStatus`, `SessionDetail`, etc. |
| `ultimate-sd/src/app/page.tsx` | Merge progress into dashboard problems |
| `ultimate-sd/src/components/landing/DashboardClient.tsx` | Status filter + merged problems prop |
| `ultimate-sd/src/components/landing/ProblemFilterBar.tsx` | Status dropdown |
| `ultimate-sd/src/components/StepByStepChat.tsx` | New write path |
| `ultimate-sd/src/app/practice/[slug]/page.tsx` | Load active session for timer |
| `ultimate-sd/src/app/profile/page.tsx` | Session-based history |
| `ultimate-sd/src/app/profile/history/[sessionId]/page.tsx` | Detail page |
| `ultimate-sd/src/components/profile/*` | Session detail UI components |

---

# Phase 1 — Foundation

## Task 1: Prisma schema restructure

**Files:**
- Modify: `ultimate-sd/prisma/schema.prisma`
- Create: `ultimate-sd/prisma/migrations/20250627120000_progress_restructure/migration.sql` (via CLI)

- [ ] **Step 1: Update schema**

Replace progress-related models in `prisma/schema.prisma` with:

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

model User {
  // ... existing fields unchanged ...
  problemProgress   ProblemProgress[]
  stepSubmissions   StepSubmission[]
  practiceSessions  PracticeSession[]
}

model PracticeSession {
  id                 String        @id @default(cuid())
  userId             String
  problemId          String
  status             SessionStatus @default(ACTIVE)
  attemptNumber      Int
  startedAt          DateTime      @default(now())
  completedAt        DateTime?
  finalScore         Int?
  diagramSnapshot    Json?
  isTimerRunning     Boolean       @default(true)
  lastPausedAt       DateTime?
  totalPausedSeconds Int           @default(0)

  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  submissions  StepSubmission[]
  activeFor    ProblemProgress? @relation("ActiveSession")

  @@index([userId, problemId])
  @@index([userId, status])
}

model ProblemProgress {
  id                 String         @id @default(cuid())
  userId             String
  problemId          String
  status             ProgressStatus @default(NOT_STARTED)
  progressPercent    Int            @default(0)
  totalAttempts      Int            @default(0)
  lastScore          Int?
  bestScore          Int?
  currentStep        String?
  startedAt          DateTime?
  lastAttemptAt      DateTime?
  nextRepetitionDate DateTime?
  completedStepIds   String[]       @default([])
  activeSessionId    String?        @unique
  sessionState       Json?          // Phase 3 removal — keep during migration

  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  activeSession PracticeSession?  @relation("ActiveSession", fields: [activeSessionId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, problemId], name: "userId_problemId")
  @@index([userId])
  @@index([problemId])
}

model StepSubmission {
  id        String   @id @default(cuid())
  userId    String
  problemId String
  sessionId String
  stepId    String
  phase     String
  content   String   @db.Text
  feedback  String?  @db.Text
  score     Int?
  isPassing Boolean  @default(false)
  createdAt DateTime @default(now())

  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  session PracticeSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([userId, problemId, stepId])
  @@index([sessionId])
}
```

- [ ] **Step 2: Create migration**

```bash
cd ultimate-sd
npx prisma migrate dev --name progress_restructure
```

Expected: migration SQL created; if `migrate dev` fails (no local DB), use:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20250627120000_progress_restructure/migration.sql
npx prisma generate
```

- [ ] **Step 3: Verify client generates**

```bash
cd ultimate-sd && npx prisma generate
```

Expected: `@prisma/client` types include `PracticeSession`, `ProgressStatus`, `SessionStatus`.

---

## Task 2: Progress utility helpers (TDD)

**Files:**
- Create: `ultimate-sd/src/lib/progress-utils.ts`
- Create: `ultimate-sd/src/lib/__tests__/progress-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/__tests__/progress-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  countTotalSteps,
  computeProgressPercent,
  deriveDisplayStatus,
  parseStepPhase,
} from '@/lib/progress-utils';

describe('countTotalSteps', () => {
  it('sums steps across all phases', () => {
    const steps = { requirements: [{}, {}], hld: [{}] } as Record<string, unknown[]>;
    expect(countTotalSteps(steps)).toBe(3);
  });
});

describe('computeProgressPercent', () => {
  it('returns 0 when no steps passed', () => {
    expect(computeProgressPercent([], 8)).toBe(0);
  });
  it('returns rounded percentage', () => {
    expect(computeProgressPercent(['requirements-0', 'requirements-1'], 8)).toBe(25);
  });
});

describe('deriveDisplayStatus', () => {
  const now = new Date('2026-06-27T12:00:00Z');

  it('returns NOT_STARTED when no sessions', () => {
    expect(deriveDisplayStatus({ sessions: [], summaryStatus: 'NOT_STARTED' }, now)).toBe('NOT_STARTED');
  });
  it('promotes COMPLETED to REVIEW_NEEDED when SRS date passed', () => {
    expect(
      deriveDisplayStatus({
        sessions: [{ status: 'COMPLETED' }],
        summaryStatus: 'COMPLETED',
        nextRepetitionDate: new Date('2026-06-01'),
      }, now)
    ).toBe('REVIEW_NEEDED');
  });
  it('returns IN_PROGRESS for active session', () => {
    expect(
      deriveDisplayStatus({
        sessions: [{ status: 'ACTIVE' }],
        summaryStatus: 'IN_PROGRESS',
      }, now)
    ).toBe('IN_PROGRESS');
  });
});

describe('parseStepPhase', () => {
  it('extracts phase from step key', () => {
    expect(parseStepPhase('requirements-0')).toBe('requirements');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd ultimate-sd && pnpm test run src/lib/__tests__/progress-utils.test.ts
```

- [ ] **Step 3: Implement helpers**

```typescript
// src/lib/progress-utils.ts
import type { ProgressStatus } from '@/types';

type SessionLike = { status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' };

export function countTotalSteps(steps: Record<string, unknown[]>): number {
  return Object.values(steps).reduce((sum, phaseSteps) => sum + phaseSteps.length, 0);
}

export function computeProgressPercent(completedStepIds: string[], totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((completedStepIds.length / totalSteps) * 100);
}

export function parseStepPhase(stepId: string): string {
  const lastDash = stepId.lastIndexOf('-');
  return lastDash === -1 ? stepId : stepId.slice(0, lastDash);
}

export function deriveDisplayStatus(
  input: {
    sessions: SessionLike[];
    summaryStatus: ProgressStatus;
    nextRepetitionDate?: Date | null;
  },
  now: Date = new Date()
): ProgressStatus {
  const hasCompleted = input.sessions.some(s => s.status === 'COMPLETED');
  const hasActive = input.sessions.some(s => s.status === 'ACTIVE');

  if (hasCompleted && input.summaryStatus === 'COMPLETED') {
    if (input.nextRepetitionDate && input.nextRepetitionDate <= now) {
      return 'REVIEW_NEEDED';
    }
    return 'COMPLETED';
  }
  if (hasActive || input.sessions.length > 0) {
    return 'IN_PROGRESS';
  }
  return 'NOT_STARTED';
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd ultimate-sd && pnpm test run src/lib/__tests__/progress-utils.test.ts
```

---

## Task 3: Types update

**Files:**
- Modify: `ultimate-sd/src/types/index.ts`

- [ ] **Step 1: Add progress types**

Append to `src/types/index.ts`:

```typescript
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW_NEEDED';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface ProblemWithStatus extends SystemDesignProblem {
  status?: ProgressStatus;
  progress?: number;
  lastPracticed?: Date;
  nextRepetitionDate?: Date;
  totalAttempts?: number;
  bestScore?: number;
}

export interface ParsedFeedback {
  score: number;
  strengths?: string[];
  weaknesses?: string[];
  missed?: string[];
  isAcceptable?: boolean;
}

export interface StepSubmissionAttempt {
  id: string;
  content: string;
  feedback: ParsedFeedback | null;
  score: number | null;
  isPassing: boolean;
  createdAt: Date;
}

export interface StepSubmissionDetail {
  stepId: string;
  stepTitle: string;
  attempts: StepSubmissionAttempt[];
}

export interface PhaseSubmissionGroup {
  phase: string;
  phaseLabel: string;
  steps: StepSubmissionDetail[];
}

export interface SessionDetail {
  id: string;
  problemTitle: string;
  problemSlug: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  finalScore?: number;
  attemptNumber: number;
  diagramSnapshot?: unknown;
  phases: PhaseSubmissionGroup[];
}
```

Remove duplicate `ProblemWithStatus` if it already exists (merge fields).

---

## Task 4: Session server actions

**Files:**
- Create: `ultimate-sd/src/app/actions/progress/sessions.ts`
- Create: `ultimate-sd/src/app/actions/__tests__/sessions.test.ts`

- [ ] **Step 1: Write failing test for startPracticeSession resume behavior**

```typescript
// src/app/actions/__tests__/sessions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: vi.fn(), practiceSession: {}, problemProgress: {} } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startPracticeSession } from '@/app/actions/progress/sessions';

describe('startPracticeSession', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
  });

  it('returns existing active session without creating a new one', async () => {
    vi.mocked(prisma.problemProgress.findUnique).mockResolvedValue({
      activeSessionId: 'sess-1',
      activeSession: { id: 'sess-1', status: 'ACTIVE', startedAt: new Date('2026-01-01'), isTimerRunning: true, totalPausedSeconds: 10, lastPausedAt: null },
    } as never);

    const result = await startPracticeSession('problem-1');
    expect(result.success).toBe(true);
    expect(result.sessionId).toBe('sess-1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
```

Add mock methods to prisma mock as needed (`findUnique` on `problemProgress`).

- [ ] **Step 2: Implement `sessions.ts`**

Key exports:

```typescript
'use server';
// startPracticeSession(problemId) → { sessionId, startedAt, isTimerRunning, totalPausedSeconds }
// - If activeSession exists with status ACTIVE → return it (no timer reset)
// - Else create PracticeSession with attemptNumber = totalAttempts + 1
// - Upsert ProblemProgress: IN_PROGRESS, activeSessionId, increment totalAttempts on NEW session only

// togglePracticeTimer(problemId) → read/write timer on active PracticeSession (move logic from progress.ts)

// completeSession(sessionId, finalScore, diagramSnapshot?) → COMPLETED session + ProblemProgress COMPLETED + bestScore + nextRepetitionDate +7d + recount user.completedProblems

// abandonSession(problemId) → mark ACTIVE → ABANDONED, create new ACTIVE session, update activeSessionId
```

Move `togglePracticeTimer` timer fields from `ProblemProgress` to `PracticeSession.activeSession`.

- [ ] **Step 3: Run test**

```bash
cd ultimate-sd && pnpm test run src/app/actions/__tests__/sessions.test.ts
```

---

## Task 5: Submission server actions

**Files:**
- Create: `ultimate-sd/src/app/actions/progress/submissions.ts`
- Create: `ultimate-sd/src/app/actions/__tests__/submissions.test.ts`

- [ ] **Step 1: Write failing test — skip empty content**

```typescript
it('skips empty content submissions', async () => {
  vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never);
  const result = await recordStepSubmission({
    sessionId: 's1', problemId: 'p1', stepId: 'requirements-0', phase: 'requirements',
    content: '   ', feedback: null, score: 0, isPassing: false,
  });
  expect(result.success).toBe(true);
  expect(result.skipped).toBe(true);
  expect(prisma.stepSubmission.create).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Implement `recordStepSubmission`**

```typescript
export async function recordStepSubmission(input: {
  sessionId: string;
  problemId: string;
  stepId: string;
  phase: string;
  content: string;
  feedback: string | null;
  score: number | null;
  isPassing: boolean;
}) {
  if (!input.content.trim()) return { success: true, skipped: true };
  // create StepSubmission
  // if isPassing && !completedStepIds.includes(stepId) → push to completedStepIds
  // recompute progressPercent via countTotalSteps(getStepsForProblem slug)
  // update ProblemProgress lastAttemptAt
}
```

- [ ] **Step 3: Refactor XP logic into `awardStepXp`**

Extract XP/streak from old `completeStep` — only runs when step passes for first time in session.

- [ ] **Step 4: Run tests**

```bash
cd ultimate-sd && pnpm test run src/app/actions/__tests__/submissions.test.ts
```

---

## Task 6: Summary read helpers

**Files:**
- Create: `ultimate-sd/src/app/actions/progress/summary.ts`
- Create: `ultimate-sd/src/app/actions/progress/index.ts`

- [ ] **Step 1: Implement `getUserProgressMap`**

```typescript
export async function getUserProgressMap(): Promise<Map<string, ProblemWithStatus>> {
  const session = await auth();
  if (!session?.user?.id) return new Map();

  const rows = await prisma.problemProgress.findMany({
    where: { userId: session.user.id },
    include: { activeSession: true },
  });

  const sessions = await prisma.practiceSession.findMany({
    where: { userId: session.user.id },
    select: { problemId: true, status: true },
  });

  // Group sessions by problemId, derive status via deriveDisplayStatus()
  // Return Map<problemId, { status, progress: progressPercent, lastPracticed, totalAttempts, bestScore, nextRepetitionDate }>
}
```

- [ ] **Step 2: Implement `getActiveSession(problemId)`**

Returns active session + submissions for practice restore.

- [ ] **Step 3: Implement `getSessionDetail(sessionId)`**

Load session with submissions, group by phase, parse feedback JSON, map step titles from `getStepsForProblem`.

Auth check: session.userId === auth user id.

- [ ] **Step 4: Create index re-exports**

```typescript
// src/app/actions/progress/index.ts
export * from './sessions';
export * from './submissions';
export * from './summary';
export { saveUserPreferences } from '../progress-legacy'; // or keep in index
```

Keep `saveUserPreferences` and deprecate old `progress.ts` by re-exporting from index. Update imports across codebase from `@/app/actions/progress` (path stays same if index replaces file — move old file to `progress-legacy.ts` or split in place).

**Recommended approach:** Rename `progress.ts` → keep `saveUserPreferences` in `preferences.ts`; new folder `progress/` with index.ts.

- [ ] **Step 5: Update all imports**

```bash
cd ultimate-sd && rg "from '@/app/actions/progress'" src/
```

Update any direct imports of removed functions.

---

## Task 7: Data backfill script

**Files:**
- Create: `ultimate-sd/scripts/migrate-progress-sessions.ts`
- Create: `ultimate-sd/scripts/__tests__/migrate-progress-sessions.test.ts`

- [ ] **Step 1: Write test for backfill logic (pure function)**

Extract `buildBackfillPlan(progressRows, submissionRows)` as testable pure function.

- [ ] **Step 2: Implement script**

For each `ProblemProgress` where `status != 'NOT_STARTED'`:
1. Create `PracticeSession` with mapped status (COMPLETED → COMPLETED, else ACTIVE)
2. Set `attemptNumber: 1`, copy timer fields from old progress row
3. Link `StepSubmission` rows matching userId+problemId → `sessionId`
4. Set `activeSessionId`, `progressPercent`, `totalAttempts: 1`
5. Log counts

Run:

```bash
cd ultimate-sd && npx tsx scripts/migrate-progress-sessions.ts
```

---

## Task 8: Dashboard progress merge

**Files:**
- Modify: `ultimate-sd/src/app/page.tsx`
- Modify: `ultimate-sd/src/components/landing/DashboardClient.tsx`
- Modify: `ultimate-sd/src/components/landing/ProblemFilterBar.tsx`
- Modify: `ultimate-sd/src/app/page.test.tsx`

- [ ] **Step 1: Update `page.tsx`**

```typescript
import { getUserProgressMap } from '@/app/actions/progress/summary';
import { PROBLEMS } from '@/lib/problems';

// Inside Home():
let problemsWithStatus = PROBLEMS;
if (session?.user?.id) {
  const progressMap = await getUserProgressMap();
  problemsWithStatus = PROBLEMS.map(p => ({
    ...p,
    ...(progressMap.get(p.id) ?? {}),
  }));
}
// Pass problemsWithStatus to DashboardClient as `problems` prop
```

- [ ] **Step 2: Update DashboardClient**

- Add `problems: ProblemWithStatus[]` prop (default to `PROBLEMS` for backward compat)
- Replace internal `PROBLEMS` usage in filter/grid with `problems` prop
- Add `statusFilter` state: `'All' | 'Not Started' | 'Attempted' | 'In Progress' | 'Completed' | 'Review Due'`
- Filter logic:
  - Attempted: `totalAttempts > 0 && status !== 'COMPLETED'`
  - In Progress: `status === 'IN_PROGRESS'`
  - etc.

- [ ] **Step 3: Add status dropdown to ProblemFilterBar**

New props: `statusFilter`, `setStatusFilter`, `statusOptions`.

- [ ] **Step 4: Update page test**

Mock `getUserProgressMap` returning one IN_PROGRESS problem; assert it passes to DashboardClient (use mock that captures props or integration test ProblemCard).

- [ ] **Step 5: Run tests**

```bash
cd ultimate-sd && pnpm test run src/app/page.test.tsx
```

---

## Task 9: StepByStepChat write path

**Files:**
- Modify: `ultimate-sd/src/components/StepByStepChat.tsx`
- Modify: `ultimate-sd/src/app/practice/[slug]/page.tsx`

- [ ] **Step 1: Add session state to StepByStepChat**

```typescript
const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

// On mount (logged in):
const result = await startPracticeSession(problem.id);
if (result.sessionId) setActiveSessionId(result.sessionId);

const restored = await getActiveSession(problem.id);
// DB wins over localStorage — hydrate savedStepData/completedSteps from submissions
```

- [ ] **Step 2: Record every evaluation**

After `/api/ai/evaluate` returns (pass OR fail):

```typescript
if (activeSessionId) {
  await recordStepSubmission({
    sessionId: activeSessionId,
    problemId: problem.id,
    stepId: currentStepKey,
    phase: currentPhase,
    content: userAnswer,
    feedback: JSON.stringify(data.feedback),
    score: Math.round(data.feedback.score),
    isPassing: data.feedback.isAcceptable,
  });
}
```

- [ ] **Step 3: Replace completion flow**

When all steps pass:
```typescript
await completeSession(activeSessionId, averageScore, diagramData);
```
Remove direct `updateProblemProgress` call.

On pass: call `awardStepXp` instead of `completeStep`.

- [ ] **Step 4: Wire abandon on "Start Over"**

Call `abandonSession(problem.id)` then reset local state.

- [ ] **Step 5: Update practice page timer**

Load timer from `activeSession` instead of `existingProgress`:

```typescript
const progress = await prisma.problemProgress.findUnique({
  where: { userId_problemId: { userId, problemId: problem.id } },
  include: { activeSession: true },
});
const existingProgress = progress?.activeSession ?? null;
```

- [ ] **Step 6: Remove premium gate on cloud sync (interim)**

Replace debounced `syncSessionState` block with DB persistence via `recordStepSubmission` on evaluation only (drafts stay localStorage until submit). Remove `hasActivePlan || hasGeminiKey` check.

---

## Task 10: Phase 1 quality gate

- [ ] **Step 1: Run full suite**

```bash
cd ultimate-sd && pnpm lint && pnpm test run && pnpm build
```

- [ ] **Step 2: Run backfill against dev DB**

```bash
cd ultimate-sd && npx tsx scripts/migrate-progress-sessions.ts
```

- [ ] **Step 3: Commit Phase 1**

```bash
git add ultimate-sd/prisma/ ultimate-sd/src/ ultimate-sd/scripts/ docs/
git commit -m "feat: restructure progress DB with PracticeSession model (Phase 1)"
```

---

# Phase 2 — Read Surfaces

## Task 11: Profile history with sessions

**Files:**
- Modify: `ultimate-sd/src/app/profile/page.tsx`
- Modify: `ultimate-sd/src/components/profile/HistoryList.tsx`

- [ ] **Step 1: Query sessions in profile page**

```typescript
const sessions = await prisma.practiceSession.findMany({
  where: { userId: user.id },
  orderBy: { startedAt: 'desc' },
  take: 50,
  include: { _count: { select: { submissions: true } } },
});
```

Map to `HistoryItemData` with `sessionId`, `attemptNumber`, `stepsCompleted` from linked progress.

- [ ] **Step 2: Enhance HistoryList**

- Add filter tabs (All / In Progress / Completed / Review Due)
- Completed rows link to `/profile/history/[sessionId]`
- In-progress rows link to `/practice/[slug]`
- Fix `/dashboard` → `/`

---

## Task 12: Session detail page

**Files:**
- Create: `ultimate-sd/src/app/profile/history/[sessionId]/page.tsx`
- Create: `ultimate-sd/src/components/profile/SessionPhaseReview.tsx`
- Create: `ultimate-sd/src/components/profile/StepAttemptCard.tsx`
- Create: `ultimate-sd/src/components/profile/DiagramSnapshotViewer.tsx`
- Create: `ultimate-sd/src/app/profile/history/[sessionId]/page.test.tsx`

- [ ] **Step 1: Write failing page test**

Mock `auth`, `getSessionDetail`; assert problem title renders.

- [ ] **Step 2: Implement server page**

```typescript
export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const detail = await getSessionDetail((await params).sessionId);
  if (!detail) notFound();
  return <SessionPhaseReview session={detail} />;
}
```

- [ ] **Step 3: Build SessionPhaseReview**

Phase tabs using shadcn Tabs; map `detail.phases` to `StepAttemptCard` list.

- [ ] **Step 4: Build StepAttemptCard**

Show latest passing attempt prominently; collapsible section for earlier failed attempts.

- [ ] **Step 5: Build DiagramSnapshotViewer**

Read-only wrapper — render stored JSON or placeholder if missing.

- [ ] **Step 6: Run tests + build**

```bash
cd ultimate-sd && pnpm test run src/app/profile/history && pnpm build
```

---

## Task 13: List view + ProblemCard polish

**Files:**
- Modify: `ultimate-sd/src/components/landing/DashboardClient.tsx` (list view)
- Modify: `ultimate-sd/src/components/ProblemCard.tsx`

- [ ] **Step 1: Add Status and Progress columns to table view**

- [ ] **Step 2: Show `totalAttempts` chip on ProblemCard when > 0 and not completed**

- [ ] **Step 3: Update ProblemCard.test.tsx if needed**

---

## Task 14: Phase 2 quality gate

- [ ] **Step 1: Run full suite**

```bash
cd ultimate-sd && pnpm lint && pnpm test run && pnpm build
```

- [ ] **Step 2: Commit Phase 2**

```bash
git commit -m "feat: add profile session history and detail review page (Phase 2)"
```

---

# Phase 3 — Cleanup

## Task 15: Remove legacy sessionState

**Files:**
- Modify: `ultimate-sd/prisma/schema.prisma` (drop `sessionState`, drop old timer fields if any remain on ProblemProgress)
- Modify: `ultimate-sd/src/components/StepByStepChat.tsx` (remove syncSessionState/getSavedSessionState)
- Delete usages: `syncSessionState`, `getSavedSessionState` from actions
- Modify: `ultimate-sd/SESSION_PERSISTENCE.md`

- [ ] **Step 1: Remove dead code**

Delete `syncSessionState`, `getSavedSessionState` functions and all call sites.

- [ ] **Step 2: Schema migration to drop sessionState**

```bash
cd ultimate-sd && npx prisma migrate dev --name drop_session_state
```

- [ ] **Step 3: Update SESSION_PERSISTENCE.md**

Document: logged-in users → DB is source of truth; localStorage is draft buffer only.

- [ ] **Step 4: Fix revalidatePath targets**

Replace `revalidatePath('/dashboard')` with `revalidatePath('/')` everywhere.

- [ ] **Step 5: Final quality gate**

```bash
cd ultimate-sd && pnpm lint && pnpm test run && pnpm build
```

- [ ] **Step 6: Commit Phase 3**

```bash
git commit -m "chore: remove legacy sessionState and premium progress gate (Phase 3)"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| PracticeSession model | Task 1 |
| StepSubmission.sessionId + phase | Task 1, 5 |
| ProblemProgress summary fields | Task 1 |
| recordStepSubmission (pass + fail) | Task 5, 9 |
| getUserProgressMap | Task 6, 8 |
| Dashboard status merge + filter | Task 8, 13 |
| Profile history + filters | Task 11 |
| Session detail page | Task 12 |
| REVIEW_NEEDED on read | Task 2, 6 |
| Backfill migration | Task 7 |
| Remove sessionState | Task 15 |
| Tests | Tasks 2, 4, 5, 8, 12 |
| localStorage draft-only | Task 9, 15 |

---

## Plan complete

Saved to `docs/superpowers/plans/2026-06-27-db-progress-restructure.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach do you want?
