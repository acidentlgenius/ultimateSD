# Adaptive Coach (Skill-Based) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dark-launched skill-based Adaptive Coach that personalizes evaluation and pacing from the learner profile, replaces the universal pass grind with ProgressGate (bar · tries · budget), and exposes a shared `/api/ai/coach/turn` core wired first into classic practice.

**Architecture:** In-repo Coach Skills (`SKILL.md` progressive disclosure) + pure policy tools + a LangGraph `StateGraph` supervisor. Shared module `src/lib/adaptive-coach/`. Classic `StepByStepChat` / `/api/ai/evaluate` gain a flag-gated bridge. Flow V2 adapter is a stub until `features/problem-flow-v2` exists (not in repo as of this plan).

**Tech Stack:** Next.js 16 App Router, Prisma 7 / PostgreSQL, NextAuth, LangChain JS + `@langchain/langgraph` (already in `package.json`), Zod, Vitest, Playwright. App root `ultimate-sd/`.

**Spec:** `docs/superpowers/specs/2026-07-14-adaptive-coach-skills-design.md`

## Global Constraints

- Feature key is exactly `'adaptiveCoach'` (add to `FEATURE_KEYS` in `src/lib/plans.ts`).
- Seed dark: `FEATURE_SEED_DEFAULTS.adaptiveCoach = []`. Intended plans: `['platform', 'lifetime', 'ai']`.
- Every coach API / evaluate bridge path must call `canAccessFeature(userId, 'adaptiveCoach')` server-side. Flag off → byte-identical legacy evaluate (`isAcceptable: score >= 7 && accuracy >= 70`).
- Progress advancement is decided only by `progressGate()` (TypeScript). Skills must not set `isAcceptable`.
- Skill runtime = thin in-repo loader (Agent Skills frontmatter). Do **not** add Deep Agents as a dependency in this plan.
- Primary UI wire = classic practice. Do **not** block on Problem Flow V2 (module absent). Provide `adapters/flow-v2.ts` as `notImplemented` stub only.
- Paths below are relative to `ultimate-sd/` unless noted (`docs/` stays repo-root).
- Tests: `pnpm test run <path>` from `ultimate-sd/`. Types: included in `pnpm build` / `npx tsc --noEmit` if configured.
- Do not commit secrets; do not weaken auth or Razorpay checks.
- Commit after each task.

## File map

| Path | Responsibility |
|------|----------------|
| `src/lib/adaptive-coach/types.ts` | Shared types |
| `src/lib/adaptive-coach/competencies.ts` | Canonical `skillId` list |
| `src/lib/adaptive-coach/tools/progress-gate.ts` | Pure pass policy |
| `src/lib/adaptive-coach/tools/stage-rails.ts` | Stages + budgets from `getPracticeSteps` |
| `src/lib/adaptive-coach/tools/budget-tick.ts` | Timer decisions |
| `src/lib/adaptive-coach/tools/load-profile.ts` | Hydrate LearnerProfile |
| `src/lib/adaptive-coach/tools/write-memory.ts` | Persist memory notes |
| `src/lib/adaptive-coach/tools/record-outcome.ts` | earned/coached + competency |
| `src/lib/adaptive-coach/skills-loader.ts` | Load SKILL.md frontmatter + body |
| `src/lib/adaptive-coach/skills/*/SKILL.md` | Six coach skills |
| `src/lib/adaptive-coach/rag/retrieve-gold.ts` | Expert + step retrieval |
| `src/lib/adaptive-coach/skills/invoke.ts` | LLM invoke + Zod parse |
| `src/lib/adaptive-coach/graph/coach-supervisor.ts` | LangGraph turn graph |
| `src/lib/adaptive-coach/index.ts` | `runCoachTurn` public API |
| `src/lib/adaptive-coach/adapters/classic.ts` | Map evaluate/step UI ↔ turn |
| `src/lib/adaptive-coach/adapters/interview.ts` | Mock mode mapping |
| `src/lib/adaptive-coach/adapters/flow-v2.ts` | Stub |
| `src/app/api/ai/coach/turn/route.ts` | HTTP seam |
| `src/app/api/ai/evaluate/route.ts` | Flag-gated bridge |
| `src/components/StepByStepChat.tsx` | Surface gate tip / advance |
| `prisma/schema.prisma` | Profile + competency + memory + submission fields |
| `src/lib/plans.ts` | Flag registration |
| `src/app/actions/progress/preferences.ts` + onboarding UI | `experienceLevel` |

---

### Task 1: Register `adaptiveCoach` feature flag

**Files:**
- Modify: `src/lib/plans.ts`
- Modify: any test that asserts exact `FEATURE_KEYS` length/contents (search `FEATURE_KEYS` in `src/lib/__tests__/`)
- Test: extend existing feature-flag tests if present; else create `src/lib/__tests__/adaptive-coach-flag.test.ts`

**Interfaces:**
- Produces: `'adaptiveCoach'` in `FeatureKey`; seed `[]`; intended `['platform','lifetime','ai']`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  FEATURE_KEYS,
  FEATURE_SEED_DEFAULTS,
  FEATURE_INTENDED_PLANS,
} from '@/lib/plans';

describe('adaptiveCoach flag', () => {
  it('is registered, seeds dark, intended for platform/lifetime/ai', () => {
    expect(FEATURE_KEYS).toContain('adaptiveCoach');
    expect(FEATURE_SEED_DEFAULTS.adaptiveCoach).toEqual([]);
    expect(FEATURE_INTENDED_PLANS.adaptiveCoach).toEqual([
      'platform',
      'lifetime',
      'ai',
    ]);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (key missing)

Run: `pnpm test run src/lib/__tests__/adaptive-coach-flag.test.ts`

- [ ] **Step 3: Implement**

In `src/lib/plans.ts`, append `'adaptiveCoach'` to `FEATURE_KEYS`, and add matching entries to `FEATURE_SEED_DEFAULTS` (`[]`) and `FEATURE_INTENDED_PLANS` (`['platform', 'lifetime', 'ai']`). Update any exhaustive switch/tests that list all keys.

- [ ] **Step 4: Run test — expect PASS**; run `pnpm seed:flags` locally so DB learns the new key (idempotent upsert).

- [ ] **Step 5: Commit**

```bash
git add src/lib/plans.ts src/lib/__tests__/adaptive-coach-flag.test.ts
git commit -m "feat(adaptive-coach): register adaptiveCoach feature flag dark"
```

---

### Task 2: Core types + competency taxonomy

**Files:**
- Create: `src/lib/adaptive-coach/types.ts`
- Create: `src/lib/adaptive-coach/competencies.ts`
- Create: `src/lib/adaptive-coach/index.ts` (re-export types)
- Test: `src/lib/adaptive-coach/__tests__/competencies.test.ts`

**Interfaces:**
- Produces types exactly as spec §4 (`PracticeMode`, `ExperienceLevel`, `LearnerProfile`, `CompetencySignal`, `MemoryNote`, `AgendaMove`, `GateDecision`, `SessionState` with `version: 'adaptive-1'`).
- Produces: `COMPETENCY_IDS` readonly array (~12 ids) and `isCompetencyId(id: string): boolean`.

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { COMPETENCY_IDS, isCompetencyId } from '@/lib/adaptive-coach/competencies';

describe('competency taxonomy', () => {
  it('seeds twelve system-design competencies', () => {
    expect(COMPETENCY_IDS).toEqual([
      'requirements',
      'capacity',
      'api-design',
      'data-model',
      'caching',
      'consistency',
      'sharding',
      'queues',
      'availability',
      'security',
      'observability',
      'tradeoffs',
    ]);
    expect(isCompetencyId('caching')).toBe(true);
    expect(isCompetencyId('nope')).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `competencies.ts` and `types.ts`** (copy types from spec §4 verbatim). Export from `index.ts`.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/adaptive-coach/
git commit -m "feat(adaptive-coach): add types and competency taxonomy"
```

---

### Task 3: `progressGate` pure policy (product invariant)

**Files:**
- Create: `src/lib/adaptive-coach/tools/progress-gate.ts`
- Test: `src/lib/adaptive-coach/__tests__/progress-gate.test.ts`

**Interfaces:**
- Produces:

```ts
export type ProgressGateInput = {
  mode: PracticeMode;
  level: ExperienceLevel;
  score: number;
  attempts: number;
  stageElapsedSec: number;
  stageBudgetSec: number;
  sessionRemainingSec: number;
};

export function getPassThreshold(mode: PracticeMode, level: ExperienceLevel): number;
export function getMaxAttempts(mode: PracticeMode, level: ExperienceLevel): number;
export function progressGate(input: ProgressGateInput): GateDecision;
```

Calibration must match spec §5.1. Map `intent === 'learn'` is **not** an input here — callers map learn → treat as fresher when building input (document in `load-profile`). Decision order: end_mock → advance_budget → pass → retry → teach_forward.

- [ ] **Step 1: Write failing matrix test**

```ts
import { describe, expect, it } from 'vitest';
import { progressGate, getPassThreshold, getMaxAttempts } from '@/lib/adaptive-coach/tools/progress-gate';

describe('progressGate', () => {
  it('uses calibrated thresholds', () => {
    expect(getPassThreshold('practice', 'fresher')).toBe(5);
    expect(getPassThreshold('practice', 'sde1')).toBe(6);
    expect(getPassThreshold('mock', 'senior')).toBe(8);
    expect(getMaxAttempts('practice', 'sde1')).toBe(3);
    expect(getMaxAttempts('mock', 'sde2')).toBe(2);
  });

  it('ends mock when session time is exhausted', () => {
    const d = progressGate({
      mode: 'mock',
      level: 'sde1',
      score: 9,
      attempts: 0,
      stageElapsedSec: 0,
      stageBudgetSec: 600,
      sessionRemainingSec: 0,
    });
    expect(d.action).toBe('end_mock');
  });

  it('advance_budget in practice when stage budget elapsed', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 3,
      attempts: 1,
      stageElapsedSec: 601,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('advance_budget');
  });

  it('passes when score meets threshold', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 6,
      attempts: 1,
      stageElapsedSec: 10,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('pass');
  });

  it('retries when under threshold and attempts remain', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 4,
      attempts: 1,
      stageElapsedSec: 10,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('retry');
  });

  it('teach_forward when attempts exhausted', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 4,
      attempts: 3,
      stageElapsedSec: 10,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('teach_forward');
    expect(d.tipSkillId).toBe('teach-forward');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `progress-gate.ts`** with the table from the spec. Accuracy is **not** used for gating.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/adaptive-coach/tools/progress-gate.ts src/lib/adaptive-coach/__tests__/progress-gate.test.ts
git commit -m "feat(adaptive-coach): pure progressGate policy matrix"
```

---

### Task 4: Stage rails + stage budgets

**Files:**
- Create: `src/lib/adaptive-coach/tools/stage-rails.ts`
- Test: `src/lib/adaptive-coach/__tests__/stage-rails.test.ts`

**Interfaces:**
- Consumes: `getPracticeSteps` from `@/lib/interview-lite-steps`, `INTERVIEW_LITE_PHASE_STEPS` for mock lite.
- Produces:

```ts
export type CoachStage = {
  id: string;           // e.g. "requirements-0"
  phaseKey: string;
  phase: string;
  title: string;
  prompt: string;
  budgetSec: number;
};

export function buildStageRails(
  slug: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  level: ExperienceLevel,
  mode: PracticeMode,
  variant?: 'lite' | 'full'
): CoachStage[];

export function canSkipStage(
  level: ExperienceLevel,
  competencyEarned: number // 0..1 for primary skillFocus
): boolean; // practice only caller; true if earned >= 0.8
```

Budget heuristic (document in file): base minutes by difficulty Easy=6 / Medium=8 / Hard=10 per stage; multiply by level fresher=1.2, sde1=1.0, sde2=0.9, senior=0.85; convert to seconds.

- [ ] **Step 1: Write failing test** for TinyURL Easy → non-empty rails; mock lite uses compact set; `canSkipStage('sde2', 0.85) === true`.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement** by flattening `Record<string, StepData[]>` into ordered `CoachStage[]` with ids `${phaseKey}-${index}`.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/adaptive-coach/tools/stage-rails.ts src/lib/adaptive-coach/__tests__/stage-rails.test.ts
git commit -m "feat(adaptive-coach): stage rails and per-stage budgets"
```

---

### Task 5: Prisma — profile fields, competency, memory, submission outcomes

**Files:**
- Modify: `prisma/schema.prisma`
- Migration via `npx prisma migrate dev --name adaptive_coach_profile` (or `db push` if team uses push locally — prefer migrate when possible)

**Interfaces:**
- User: `experienceLevel String @default("")`, `targetRole String?`, `interviewDate DateTime?`
- Models:

```prisma
model CompetencySignal {
  id        String   @id @default(cuid())
  userId    String
  skillId   String
  earned    Float    @default(0)
  coached   Float    @default(0)
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, skillId])
  @@index([userId])
}

model CoachMemoryNote {
  id          String   @id @default(cuid())
  userId      String
  text        String
  tags        String[] @default([])
  problemSlug String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

- `PracticeSession.adaptiveState Json?`
- `StepSubmission.gateAction String?`, `StepSubmission.outcome String?` // earned | coached
- User relations for both new models

- [ ] **Step 1: Apply schema edits**

- [ ] **Step 2: Generate client** — `npx prisma generate`

- [ ] **Step 3: Commit**

```bash
git add prisma/
git commit -m "feat(adaptive-coach): schema for profile, competency, memory, outcomes"
```

---

### Task 6: loadProfile, writeMemory, recordOutcome, budgetTick

**Files:**
- Create: `src/lib/adaptive-coach/tools/load-profile.ts`
- Create: `src/lib/adaptive-coach/tools/write-memory.ts`
- Create: `src/lib/adaptive-coach/tools/record-outcome.ts`
- Create: `src/lib/adaptive-coach/tools/budget-tick.ts`
- Test: `src/lib/adaptive-coach/__tests__/load-profile.test.ts` (mock prisma)
- Test: `src/lib/adaptive-coach/__tests__/budget-tick.test.ts`

**Interfaces:**

```ts
export function resolveExperienceLevel(
  experienceLevel: string,
  practiceIntent: string
): ExperienceLevel;
// '' + intent learn → fresher; '' otherwise → sde1; validate enum else sde1

export async function loadProfile(userId: string): Promise<LearnerProfile>;
// last 20 CoachMemoryNote; all CompetencySignal for user

export async function writeMemoryNotes(
  userId: string,
  notes: Omit<MemoryNote, 'id' | 'createdAt'>[]
): Promise<void>;

export async function recordOutcome(args: {
  userId: string;
  skillIds: string[];
  outcome: 'earned' | 'coached';
  delta?: number; // default 0.15 earned, 0.1 coached, clamp 0..1
}): Promise<void>;

export function budgetTick(args: {
  mode: PracticeMode;
  sessionRemainingSec: number;
}): { warn: boolean; endMock: boolean };
```

- [ ] **Step 1: Tests** for `resolveExperienceLevel` and `budgetTick` (pure). Mock prisma for `loadProfile` defaults when user has empty fields.

- [ ] **Step 2: Implement**

- [ ] **Step 3: PASS + commit**

```bash
git commit -m "feat(adaptive-coach): profile load, memory, outcomes, budget tick"
```

---

### Task 7: In-repo skills loader

**Files:**
- Create: `src/lib/adaptive-coach/skills-loader.ts`
- Create: six `src/lib/adaptive-coach/skills/<name>/SKILL.md` stubs with frontmatter (full instruction bodies filled in Tasks 8–9, 14–15 — for this task create minimal valid files listing name/description + one-line body)
- Test: `src/lib/adaptive-coach/__tests__/skills-loader.test.ts`

**Interfaces:**

```ts
export type CoachSkillName =
  | 'plan-agenda'
  | 'evaluate-for-level'
  | 'teach-forward'
  | 'mock-probe'
  | 'session-debrief'
  | 'profile-reflect';

export type LoadedSkill = {
  name: CoachSkillName;
  description: string;
  body: string;
};

export function listSkillMetadata(): Pick<LoadedSkill, 'name' | 'description'>[];
export function loadSkill(name: CoachSkillName): LoadedSkill;
```

Parse YAML frontmatter between `---` fences (`name`, `description`). Use `fs.readFileSync` + `path.join` with `process.cwd()` / `import.meta` careful for Next bundling — prefer embedding via `fs` only on server; mark files as server-only. Alternative acceptable: export a `SKILLS: Record<CoachSkillName, LoadedSkill>` built at module init by reading files with `node:fs` in a `'server-only'` module.

- [ ] **Step 1: Test** that `listSkillMetadata()` returns 6 names and `loadSkill('plan-agenda').body.length > 0`.

- [ ] **Step 2: Implement loader + six SKILL.md files**

Example frontmatter:

```md
---
name: plan-agenda
description: Plan the next 1–3 agenda moves for the current stage from profile and performance.
---
You are the Adaptive Coach agenda planner...
```

- [ ] **Step 3: PASS + commit**

```bash
git commit -m "feat(adaptive-coach): in-repo SKILL.md loader and skill stubs"
```

---

### Task 8: RAG retrieve-gold + evaluate-for-level invoke

**Files:**
- Create: `src/lib/adaptive-coach/rag/retrieve-gold.ts`
- Create: `src/lib/adaptive-coach/skills/invoke.ts`
- Replace body: `src/lib/adaptive-coach/skills/evaluate-for-level/SKILL.md`
- Test: `src/lib/adaptive-coach/__tests__/retrieve-gold.test.ts`
- Test: `src/lib/adaptive-coach/__tests__/evaluate-skill-schema.test.ts` (Zod only, mock LLM)

**Interfaces:**

```ts
export function retrieveGold(args: {
  problemSlug: string;
  stageId: string;
  skillFocus: string[];
}): { chunks: string[] }; // from getSolution + step prompt; max ~4 chunks

export const EvaluateSkillOutputSchema = z.object({
  score: z.number().min(0).max(10),
  accuracy: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missed: z.array(z.string()),
});

export async function invokeEvaluateForLevel(args: {
  llm: BaseChatModel;
  profile: LearnerProfile;
  problemTitle: string;
  stage: CoachStage;
  userAnswer: string;
  gold: string[];
}): Promise<z.infer<typeof EvaluateSkillOutputSchema>>;
```

Skill body must instruct: personalize depth to `profile.level` / intent; return **JSON only** matching schema; do **not** output `isAcceptable`.

- [ ] **Step 1–4: TDD schema + retrieveGold for a known slug with solution** + implement invoke using `HumanMessage` + JSON parse retry (mirror evaluate route pattern lightly).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(adaptive-coach): RAG gold + evaluate-for-level skill"
```

---

### Task 9: plan-agenda + teach-forward skills

**Files:**
- Update: `skills/plan-agenda/SKILL.md`, `skills/teach-forward/SKILL.md`
- Extend: `skills/invoke.ts` with `invokePlanAgenda`, `invokeTeachForward`
- Test: Zod schemas + **deterministic fallback** when LLM throws

**Interfaces:**

```ts
export const AgendaOutputSchema = z.object({
  moves: z.array(z.object({
    kind: z.enum(['ask', 'probe', 'teach', 'skip', 'advance']),
    prompt: z.string().min(1),
    skillFocus: z.array(z.string()),
  })).min(1).max(3),
});

export function fallbackAgenda(stage: CoachStage): AgendaMove[];
// single ask from stage.prompt, source: 'rail'

export const TeachForwardSchema = z.object({
  tip: z.string().min(1),
  skillFocus: z.array(z.string()),
});
```

teach-forward: one focused tip from gold; explicitly ban dumping full expert architecture.

- [ ] **Step 1: Tests** for fallback and schema validation

- [ ] **Step 2: Implement**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(adaptive-coach): plan-agenda and teach-forward skills"
```

---

### Task 10: CoachSupervisor graph + `runCoachTurn`

**Files:**
- Create: `src/lib/adaptive-coach/graph/coach-supervisor.ts`
- Update: `src/lib/adaptive-coach/index.ts`
- Test: `src/lib/adaptive-coach/__tests__/coach-turn.test.ts` (mock LLM + prisma)

**Interfaces:**

```ts
export type CoachTurnEvent =
  | { type: 'start' }
  | { type: 'submit'; userAnswer: string; stageId: string }
  | { type: 'tick'; sessionRemainingSec: number }
  | { type: 'finish' };

export type CoachTurnRequest = {
  userId: string;
  problemSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mode: PracticeMode;
  variant?: 'lite' | 'full';
  event: CoachTurnEvent;
  sessionState: SessionState | null;
  llm: BaseChatModel;
};

export type CoachTurnResponse = {
  sessionState: SessionState;
  ui: {
    agenda: AgendaMove[];
    feedback?: z.infer<typeof EvaluateSkillOutputSchema> & { isAcceptable: boolean };
    gate?: GateDecision;
    tip?: string;
  };
};

export async function runCoachTurn(req: CoachTurnRequest): Promise<CoachTurnResponse>;
```

Graph nodes (LangGraph `StateGraph`): `hydrate` → branch on event → `evaluate` / `plan` / `gate` / `teach` / `persist`. On `submit`: evaluate skill → increment attempts → `progressGate` → maybe teach-forward → update `SessionState` → set `feedback.isAcceptable = gate.action === 'pass'`.

- [ ] **Step 1: Integration-style unit test** — mock `invokeEvaluateForLevel` to return score 4 twice then teach path; assert third response after attempts exhausted has `gate.action === 'teach_forward'` and `tip` defined; `isAcceptable` false until pass.

- [ ] **Step 2: Implement supervisor** (if LangGraph wiring is awkward in tests, keep `StateGraph` but export pure `runCoachTurn` orchestration used by API — still import `@langchain/langgraph` for the graph).

- [ ] **Step 3: PASS + commit**

```bash
git commit -m "feat(adaptive-coach): CoachSupervisor runCoachTurn orchestrator"
```

---

### Task 11: `POST /api/ai/coach/turn`

**Files:**
- Create: `src/app/api/ai/coach/turn/route.ts`
- Test: `src/app/api/ai/coach/__tests__/turn.route.test.ts` (auth + flag mocks)

**Behavior:**
1. `auth()` — 401 if missing  
2. `canAccessFeature(userId, 'adaptiveCoach')` — 403 if false  
3. Resolve LLM via `getUserLLM` — map `AIAccessError` to 402/403  
4. Parse body with Zod (`event`, `problemSlug`, `mode`, `sessionState`, …)  
5. `runCoachTurn` → JSON  
6. PostHog `coach_turn` with `gateAction`, `mode`, `level` — no answer text  

- [ ] **Step 1: Test** 403 when flag denied; 401 when no session

- [ ] **Step 2: Implement route**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(adaptive-coach): add /api/ai/coach/turn route"
```

---

### Task 12: Bridge classic `/api/ai/evaluate` + StepByStepChat UX

**Files:**
- Modify: `src/app/api/ai/evaluate/route.ts`
- Modify: `src/components/StepByStepChat.tsx`
- Create: `src/lib/adaptive-coach/adapters/classic.ts`
- Test: evaluate route flag-off still sets `isAcceptable` from score≥7 && accuracy≥70 (existing behavior); flag-on uses gate

**Classic adapter:** maps evaluate body → `runCoachTurn` submit event; returns feedback shape StepByStepChat already expects plus optional `gate` + `tip`.

**Evaluate route (flag on):**
1. Check `canAccessFeature`  
2. If false → legacy prompt path unchanged  
3. If true → `loadProfile` + evaluate skill + `progressGate` using attempts from body (`attemptCount` new optional field defaulting to 1)  
4. Set `isAcceptable = gate.action === 'pass'`  
5. Include `gate` and `tip` (if teach_forward) in JSON  

**StepByStepChat:**
- Track `attemptsByStep: Record<string, number>`  
- Pass attempt count to evaluate  
- On `gate.action === 'teach_forward'`: show tip toast/panel and treat step as completable (`completed: true`) with coached UX (not XP celebrate as earned — keep XP only on `pass` / earned)  
- On `advance_budget`: allow advance with coach note  
- Persist `gateAction` / `outcome` on `recordStepSubmission` if action API supports it (extend progress action if needed)

- [ ] **Step 1: Unit/route tests for flag off vs on acceptability**

- [ ] **Step 2: Implement bridge + UI**

- [ ] **Step 3: Manual smoke** with per-user flag grant: fail TinyURL FR thrice → tip → can proceed

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(adaptive-coach): classic evaluate bridge and teach-forward UX"
```

---

### Task 13: Onboarding — capture `experienceLevel`

**Files:**
- Modify: `src/lib/onboarding.ts` (export levels)
- Modify: `src/components/OnboardingModal.tsx`
- Modify: `src/app/actions/progress/preferences.ts` — accept `experienceLevel`, `targetRole?`
- Test: onboarding helper unit test

- [ ] **Step 1: Add level picker** (fresher / sde1 / sde2 / senior) to onboarding; persist via `saveUserPreferences`

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(adaptive-coach): capture experienceLevel in onboarding"
```

---

### Task 14: profile-reflect + memory on session complete

**Files:**
- Update: `skills/profile-reflect/SKILL.md`
- Extend invoke + call from `runCoachTurn` on `finish`
- Wire classic session complete / interview end to fire finish event (best-effort)

- [ ] **Step 1: Schema for 0–3 notes; writeMemoryNotes; non-blocking try/catch**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(adaptive-coach): profile-reflect memory writes on finish"
```

---

### Task 15: Interview/mock adapter + mock-probe + session-debrief

**Files:**
- Create: `src/lib/adaptive-coach/adapters/interview.ts`
- Update: mock-probe + session-debrief SKILL.md + invoke
- Modify: interview summary path or PracticeUI interview end to call coach finish when flag on
- Create: `src/lib/adaptive-coach/adapters/flow-v2.ts` stub:

```ts
export function runFlowV2CoachTurn(): never {
  throw new Error('Problem Flow V2 adapter not implemented — flow module not in tree yet');
}
```

- [ ] **Step 1: Align probe round caps with existing `PROBE_MIN_ROUNDS` / `PROBE_MAX_ROUNDS` if imported from probe module**

- [ ] **Step 2: Mock mode `progressGate` + timer uses `end_mock`**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(adaptive-coach): mock/interview adapter and debrief skills"
```

---

### Task 16: E2E — teach_forward unblocks practice

**Files:**
- Create: `ultimate-sd/e2e/adaptive-coach.spec.ts`
- Extend: `scripts/seed-e2e.ts` if needed to grant `adaptiveCoach` override for e2e user

**Scenario (flag granted):**
1. Login as e2e user with override  
2. Open a free problem practice  
3. Intercept `/api/ai/evaluate` to return low scores until teach_forward path (or use real AI if env has key — prefer route mock via Playwright)  
4. Assert UI shows tip and step can complete without infinite fail loop  

Mock timer end → debrief is optional stretch; practice path is required.

- [ ] **Step 1: Implement e2e**

- [ ] **Step 2: Commit**

```bash
git commit -m "test(adaptive-coach): e2e teach_forward advances practice step"
```

---

## Plan self-review

| Spec requirement | Task(s) |
|------------------|---------|
| Feature flag dark + intended plans | 1 |
| Types + competencies | 2 |
| ProgressGate calibration | 3 |
| Stage rails + budgets | 4 |
| Persistence models | 5 |
| Profile / memory / outcomes | 6, 14 |
| SKILL.md loader | 7 |
| evaluate / agenda / teach skills + RAG | 8, 9 |
| CoachSupervisor + turn API | 10, 11 |
| Classic wire (time-lie fix) | 12, 13 |
| Cross-session memory | 14 |
| Mock/interview | 15 |
| Flow V2 first | **Deferred** — stub only (module absent); classic first |
| E2E | 16 |
| Voice | Out of scope per spec |

**Placeholder scan:** none intentional.  
**Type consistency:** `GateDecision.action` and `CoachTurnResponse.ui` aligned across Tasks 3, 10–12.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-15-adaptive-coach-skills.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
