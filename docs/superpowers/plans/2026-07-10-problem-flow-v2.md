# Problem Flow V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canvas-first guided problem-solving flow (one persistent Excalidraw scene + 7 guided stages) behind the DB-backed `newProblemFlow` feature flag, per spec `docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md`.

**Architecture:** New vertical module `src/features/problem-flow-v2/` rendered by `practice/[slug]/page.tsx` when the flag is on; old `PracticeUI` untouched. Zustand store per session; one Excalidraw scene per attempt with per-stage element tagging; canvas→text serializer feeds the existing `/api/ai/evaluate`; persistence = localStorage cache + two new Json columns on `PracticeSession`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind v4, `@excalidraw/excalidraw@0.18`, Zustand (new dep), Prisma/Postgres, Vitest.

## Global Constraints

- All app code lives under `ultimate-sd/` — **run every command from `ultimate-sd/`** unless stated otherwise.
- Package manager: `pnpm`. Tests: `pnpm vitest run <path>`.
- Path alias `@/*` → `src/*`.
- Flag key literal: `newProblemFlow` (DB `FeatureFlag` system — no env vars).
- Old flow must be byte-identical when the flag is off. The ONLY existing files modified in this plan: `src/lib/plans.ts`, `src/app/practice/[slug]/page.tsx`, `prisma/schema.prisma`, plus a new server-action file.
- localStorage canvas key: `canvas-v2-${problemId}`. Flow-state key: `flow-v2-${problemId}`.
- Excalidraw `files` are always stripped before any persistence (reuse `stripFilesForPersistence`).
- Dark minimal UI per `Ultimate_SD_Canvas_Redesign/Canvas Session.dc.html`: bg `#0e0f12`, panel `#121318`/`#16171d`, border `rgba(255,255,255,.07)`, text `#e8e9eb`, muted `#8a8d96`/`#6b6e77`, accent `#8f95f2`.
- Components PascalCase `.tsx`, lib files kebab-case `.ts`, client components start with `'use client'`, tests colocated in `__tests__/`.
- Commit after every task (steps include the command).

---

### Task 1: Register the `newProblemFlow` feature flag

**Files:**
- Modify: `src/lib/plans.ts:45-80`
- Test: `src/lib/__tests__/plans-flow-v2.test.ts`

**Interfaces:**
- Produces: `'newProblemFlow'` as a valid `FeatureKey` usable with `canAccessFeature(userId, 'newProblemFlow')`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/plans-flow-v2.test.ts
import { describe, it, expect } from 'vitest';
import { FEATURE_KEYS, FEATURE_SEED_DEFAULTS, FEATURE_INTENDED_PLANS } from '@/lib/plans';

describe('newProblemFlow feature flag registry', () => {
  it('is a registered feature key', () => {
    expect(FEATURE_KEYS).toContain('newProblemFlow');
  });

  it('seeds dark (no plans enabled)', () => {
    expect(FEATURE_SEED_DEFAULTS.newProblemFlow).toEqual([]);
  });

  it('is intended for all plans (UX rollout flag, not monetization)', () => {
    expect(FEATURE_INTENDED_PLANS.newProblemFlow).toEqual(['free', 'platform', 'lifetime', 'ai']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/plans-flow-v2.test.ts`
Expected: FAIL — `newProblemFlow` not in `FEATURE_KEYS`; TypeScript errors on the record accesses.

- [ ] **Step 3: Add the key to the three registries**

In `src/lib/plans.ts`, extend `FEATURE_KEYS`:

```typescript
export const FEATURE_KEYS = [
  'fresherTrack',
  'interviewMode',
  'aiProbe',
  'lifetimePlan',
  'voiceInterview',
  'newProblemFlow',
] as const;
```

Add to `FEATURE_SEED_DEFAULTS`: `newProblemFlow: [],`
Add to `FEATURE_INTENDED_PLANS`: `newProblemFlow: ['free', 'platform', 'lifetime', 'ai'],`
Extend the doc comment above `FEATURE_SEED_DEFAULTS` with one line: `*   newProblemFlow → free, platform, lifetime, ai (canvas-first practice flow rollout)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/plans-flow-v2.test.ts`
Expected: PASS (3 tests). Also run `pnpm vitest run src/lib` to confirm no other flag tests broke (seed script and admin panel iterate `FEATURE_KEYS`, they pick the new key up automatically).

- [ ] **Step 5: Commit**

```bash
git add src/lib/plans.ts src/lib/__tests__/plans-flow-v2.test.ts
git commit -m "feat(flow-v2): register newProblemFlow feature flag"
```

---

### Task 2: Types + stage-journey adapter

**Files:**
- Create: `src/features/problem-flow-v2/types.ts`
- Create: `src/features/problem-flow-v2/lib/stage-journey.ts`
- Test: `src/features/problem-flow-v2/__tests__/stage-journey.test.ts`

**Interfaces:**
- Consumes: `StepData`, `SystemDesignProblem` from `@/types`; `buildStepKey(phaseKey: string, stepIndex: number): string` from `@/lib/step-journey`.
- Produces:
  - `type StageId = 'understanding' | 'fr' | 'nfr' | 'entities' | 'api' | 'hld' | 'deepdive'`
  - `type Seniority = 'beginner' | 'mid' | 'senior'`
  - `type StageStatus = 'untouched' | 'active' | 'submitted' | 'passed'`
  - `type FlowStage = { id, label, budgetMinutes, explain, tipsBySeniority, suggestionsBySeniority, region, sourceSteps }` (full shape below)
  - `type StageRegion = { x: number; y: number; w: number; h: number; zoom: number }`
  - `type FlowStateV2 = { version: 2; currentStage: number; stageStatuses: Record<string, StageStatus>; seniority: Seniority; explanationSeen: string[]; updatedAt: string }`
  - `buildStageJourney(phaseSteps: Record<string, StepData[]>, problem: SystemDesignProblem): FlowStage[]`

- [ ] **Step 1: Write types**

```typescript
// src/features/problem-flow-v2/types.ts
import type { StepData } from '@/types';

export type StageId =
  | 'understanding'
  | 'fr'
  | 'nfr'
  | 'entities'
  | 'api'
  | 'hld'
  | 'deepdive';

export type Seniority = 'beginner' | 'mid' | 'senior';

export type StageStatus = 'untouched' | 'active' | 'submitted' | 'passed';

/** Canvas-space home region a stage's camera pans to (canvas coordinates). */
export type StageRegion = { x: number; y: number; w: number; h: number; zoom: number };

/** A source step from the existing journey, with its evaluate-API routing info. */
export type SourceStep = {
  step: StepData;
  /** Existing StepSubmission.stepId format, e.g. "requirements-0" */
  stepKey: string;
  /** Phase key in the phaseSteps record, e.g. "requirements" — evaluate API `phaseKey` */
  phaseKey: string;
};

export type FlowStage = {
  id: StageId;
  label: string;
  budgetMinutes: number;
  /** Explanation-card body (2–3 sentences). */
  explain: string;
  tipsBySeniority: Record<Seniority, string[]>;
  suggestionsBySeniority: Record<Seniority, string[]>;
  region: StageRegion;
  /** Empty for 'understanding' (not submittable). First entry routes AI evaluation. */
  sourceSteps: SourceStep[];
};

export type FlowStateV2 = {
  version: 2;
  currentStage: number;
  stageStatuses: Record<string, StageStatus>;
  seniority: Seniority;
  /** StageIds whose explanation card was dismissed. */
  explanationSeen: string[];
  updatedAt: string;
};

export type FeedbackResult = {
  score: number;
  accuracy?: number;
  strengths: string[];
  weaknesses: string[];
  missed: string[];
  isAcceptable: boolean;
};

export type FeedbackState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: FeedbackResult; recorded: boolean }
  | { status: 'error'; code: string; message: string };
```

- [ ] **Step 2: Write the failing test**

```typescript
// src/features/problem-flow-v2/__tests__/stage-journey.test.ts
import { describe, it, expect } from 'vitest';
import { buildStageJourney } from '../lib/stage-journey';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: 'p1',
  title: 'Design YouTube',
  slug: 'design-youtube',
  context: 'A video platform.',
  functionalRequirements: ['Upload video'],
  nonFunctionalRequirements: ['1B DAU'],
  difficulty: 'Hard',
  category: 'Media',
  companies: [],
};

describe('buildStageJourney', () => {
  it('maps the default step set onto the 7 canonical stages in order', () => {
    const stages = buildStageJourney(DEFAULT_PHASE_STEPS, problem);
    expect(stages.map((s) => s.id)).toEqual([
      'understanding', 'fr', 'nfr', 'entities', 'api', 'hld', 'deepdive',
    ]);
  });

  it('understanding stage has no source steps (not submittable)', () => {
    const stages = buildStageJourney(DEFAULT_PHASE_STEPS, problem);
    expect(stages[0].sourceSteps).toEqual([]);
    expect(stages[0].explain).toContain('A video platform.');
  });

  it('routes fr to requirements/functional with correct stepKey', () => {
    const fr = buildStageJourney(DEFAULT_PHASE_STEPS, problem).find((s) => s.id === 'fr')!;
    expect(fr.sourceSteps[0].step.subStep).toBe('functional');
    expect(fr.sourceSteps[0].phaseKey).toBe('requirements');
    expect(fr.sourceSteps[0].stepKey).toBe('requirements-0');
  });

  it('nfr absorbs non-functional and constraints steps', () => {
    const nfr = buildStageJourney(DEFAULT_PHASE_STEPS, problem).find((s) => s.id === 'nfr')!;
    expect(nfr.sourceSteps.map((s) => s.step.subStep)).toEqual(['non-functional', 'constraints']);
  });

  it('unmatched steps (lld, tradeoffs, scalability) all land in deepdive', () => {
    const dd = buildStageJourney(DEFAULT_PHASE_STEPS, problem).find((s) => s.id === 'deepdive')!;
    const phases = new Set(dd.sourceSteps.map((s) => s.phaseKey));
    expect(phases).toEqual(new Set(['lld', 'tradeoffs', 'scalability']));
  });

  it('drops stages with no source steps (except understanding)', () => {
    const onlyReqs = { requirements: DEFAULT_PHASE_STEPS.requirements };
    const stages = buildStageJourney(onlyReqs, problem);
    expect(stages.map((s) => s.id)).toEqual(['understanding', 'fr', 'nfr']);
  });

  it('every stage has three seniority tiers of tips', () => {
    for (const stage of buildStageJourney(DEFAULT_PHASE_STEPS, problem)) {
      expect(stage.tipsBySeniority.beginner.length).toBeGreaterThan(0);
      expect(stage.tipsBySeniority.mid.length).toBeGreaterThan(0);
      expect(stage.tipsBySeniority.senior.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/stage-journey.test.ts`
Expected: FAIL — cannot resolve `../lib/stage-journey`.

- [ ] **Step 4: Implement the adapter**

```typescript
// src/features/problem-flow-v2/lib/stage-journey.ts
import type { StepData, SystemDesignProblem } from '@/types';
import { buildStepKey } from '@/lib/step-journey';
import type { FlowStage, Seniority, SourceStep, StageId, StageRegion } from '../types';

/** Canvas layout anchors mirroring the design capture (left → right narrative). */
export const STAGE_REGIONS: Record<StageId, StageRegion> = {
  understanding: { x: 120, y: 170, w: 470, h: 320, zoom: 1 },
  fr:            { x: 690, y: 150, w: 520, h: 240, zoom: 1 },
  nfr:           { x: 690, y: 420, w: 470, h: 260, zoom: 1 },
  entities:      { x: 1250, y: 150, w: 580, h: 420, zoom: 1 },
  api:           { x: 1250, y: 600, w: 460, h: 260, zoom: 1 },
  hld:           { x: 1870, y: 120, w: 1030, h: 640, zoom: 0.8 },
  deepdive:      { x: 1890, y: 780, w: 720, h: 400, zoom: 1 },
};

const STAGE_LABELS: Record<StageId, string> = {
  understanding: 'Problem understanding',
  fr: 'Functional requirements',
  nfr: 'Non-functional requirements',
  entities: 'Core entities',
  api: 'API design',
  hld: 'High-level design',
  deepdive: 'Deep dives',
};

const STAGE_BUDGETS: Record<StageId, number> = {
  understanding: 3, fr: 5, nfr: 5, entities: 5, api: 5, hld: 15, deepdive: 10,
};

/** subStep → stage routing. Anything unmatched falls into deepdive. */
const SUBSTEP_TO_STAGE: Record<string, StageId> = {
  functional: 'fr',
  'non-functional': 'nfr',
  constraints: 'nfr',
  'data-model': 'entities',
  api: 'api',
  architecture: 'hld',
};

const STAGE_ORDER: StageId[] = ['understanding', 'fr', 'nfr', 'entities', 'api', 'hld', 'deepdive'];

function tiers(beginner: string[], mid: string[], senior: string[]) {
  return { beginner, mid, senior } as Record<Seniority, string[]>;
}

/** Static guidance per stage; the mid tier is the baseline, beginner adds scaffolding, senior adds depth. */
const STAGE_GUIDANCE: Record<StageId, { explain: string; tips: Record<Seniority, string[]>; suggestions: Record<Seniority, string[]> }> = {
  understanding: {
    explain: 'Read the problem and restate it in your own words on the canvas. Note who the users are and what success looks like — this anchors every later decision.',
    tips: tiers(
      ['Rewrite the problem in one sentence', 'List the 2–3 user types', 'Note any numbers given (users, traffic, data size)'],
      ['Restate the core flow you will optimize for', 'Call out what is explicitly out of scope'],
      ['Identify the hardest constraint up front', 'State the primary read/write path you will design around'],
    ),
    suggestions: tiers(
      ['Sticky-note: "who uses this and why?"'],
      ['Mark the single flow that matters most'],
      ['Note the axis you expect trade-offs on (latency vs cost vs consistency)'],
    ),
  },
  fr: {
    explain: 'List what the system must do — short verb phrases, boxes or notes. 3–5 core features beat an exhaustive list; mark nice-to-haves as "later".',
    tips: tiers(
      ['One box per feature, verb first ("Upload a video")', 'Aim for 3–5 core features', 'Mark extras as "later"'],
      ['Prioritize the features on the critical path', 'Keep each requirement testable'],
      ['Scope ruthlessly — say what you are NOT building', 'Tie each FR to a user type'],
    ),
    suggestions: tiers(
      ['Start from the problem card: what did it promise users?'],
      ['Dashed box = deferred feature'],
      ['Flag the FR that will dominate the architecture'],
    ),
  },
  nfr: {
    explain: 'Quantify the qualities: scale, latency, availability vs consistency, storage. Numbers on canvas now become justifications later.',
    tips: tiers(
      ['Estimate daily users and requests', 'Pick availability or consistency per flow', 'Note read:write ratio'],
      ['Back-of-envelope storage/yr and QPS', 'Set a latency target for the hot path'],
      ['Derive numbers from FRs, not vibes', 'Note which NFR drives cost'],
    ),
    suggestions: tiers(
      ['Template: "X DAU · read heavy · p95 < Y ms"'],
      ['Arrow from the NFR to the FR it constrains'],
      ['Mark the NFR you would negotiate with the interviewer'],
    ),
  },
  entities: {
    explain: 'Sketch the core nouns and their relationships — small boxes with key fields, lines for 1:N. Keep it to the entities the FRs actually need.',
    tips: tiers(
      ['One box per entity with 2–3 key fields', 'Draw lines for relationships', 'Start from the FR nouns'],
      ['Include ids and foreign keys', 'Note cardinality (1:N, M:N)'],
      ['Mark entities that will be hot or huge', 'Note fields that imply an index'],
    ),
    suggestions: tiers(
      ['User, plus the 2–3 nouns from your FRs'],
      ['Status enums deserve a field ("processing | live")'],
      ['Which entity gets sharded first?'],
    ),
  },
  api: {
    explain: 'Write the handful of endpoints the client actually calls — method, path, and a one-line note. Match them 1:1 to your functional requirements.',
    tips: tiers(
      ['One endpoint per FR', 'METHOD /path format', 'Note request/response essentials only'],
      ['Think about pagination/cursors on list endpoints', 'Note idempotency on writes'],
      ['Call out the endpoint with the strictest SLA', 'Consider upload/resumable patterns where relevant'],
    ),
    suggestions: tiers(
      ['POST to create, GET to read — keep it boring'],
      ['A code-style block keeps APIs readable'],
      ['Which endpoint would you rate-limit first?'],
    ),
  },
  hld: {
    explain: 'Draw the architecture: client through to storage. Boxes and arrows, label every arrow. Cover each functional requirement end to end.',
    tips: tiers(
      ['Client → LB/API → services → DB, left to right', 'Label every arrow', 'Check: can each FR be traced through the diagram?'],
      ['Separate the read and write paths', 'Add cache/CDN where the NFRs demand it'],
      ['Design around the dominant NFR', 'Make async boundaries (queues) explicit'],
    ),
    suggestions: tiers(
      ['Start with 5 boxes; add only when a requirement forces it'],
      ['Dashed box = async/background work'],
      ['Annotate the arrow that carries the most traffic'],
    ),
  },
  deepdive: {
    explain: 'Stress the design: bottlenecks, trade-offs, failure modes. Circle the risky parts of your diagram and annotate how you would fix them.',
    tips: tiers(
      ['Circle the busiest component', 'Ask: what breaks first at 10x?', 'Note one fix per bottleneck'],
      ['Cover one scaling story and one failure story', 'Justify your biggest trade-off'],
      ['Quantify the bottleneck before fixing it', 'Discuss blast radius and graceful degradation'],
    ),
    suggestions: tiers(
      ['Red dashed circles read as "risk" at a glance'],
      ['Numbered annotations keep deep dives skimmable'],
      ['What would you profile first in production?'],
    ),
  },
};

/**
 * Adapt the existing per-problem step journey onto the v2 canvas stages.
 * Stages with no source steps are dropped — except 'understanding', which is
 * synthetic (problem context) and always present.
 */
export function buildStageJourney(
  phaseSteps: Record<string, StepData[]>,
  problem: SystemDesignProblem,
): FlowStage[] {
  const buckets = new Map<StageId, SourceStep[]>();
  for (const id of STAGE_ORDER) buckets.set(id, []);

  for (const [phaseKey, steps] of Object.entries(phaseSteps)) {
    steps.forEach((step, index) => {
      const stageId = SUBSTEP_TO_STAGE[step.subStep] ?? 'deepdive';
      buckets.get(stageId)!.push({ step, phaseKey, stepKey: buildStepKey(phaseKey, index) });
    });
  }

  return STAGE_ORDER.flatMap((id): FlowStage[] => {
    const sourceSteps = id === 'understanding' ? [] : buckets.get(id)!;
    if (id !== 'understanding' && sourceSteps.length === 0) return [];
    const g = STAGE_GUIDANCE[id];
    return [{
      id,
      label: STAGE_LABELS[id],
      budgetMinutes: STAGE_BUDGETS[id],
      explain: id === 'understanding' ? `${g.explain}\n\n${problem.context}` : g.explain,
      tipsBySeniority: g.tips,
      suggestionsBySeniority: g.suggestions,
      region: STAGE_REGIONS[id],
      sourceSteps,
    }];
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/stage-journey.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/problem-flow-v2
git commit -m "feat(flow-v2): types and stage-journey adapter over existing step sets"
```

---

### Task 3: Prisma columns + `syncFlowV2Session` server action

**Files:**
- Modify: `prisma/schema.prisma:147-167` (PracticeSession model)
- Create: `src/app/actions/progress/flow-v2.ts`
- Test: `src/app/actions/progress/__tests__/flow-v2.test.ts`

**Interfaces:**
- Produces: `syncFlowV2Session(input: { sessionId: string; canvasState?: unknown; flowState?: unknown }): Promise<{ success: boolean; error?: string }>` — persists to `PracticeSession.canvasState` / `.flowState`, owner-checked.
- Produces: `PracticeSession.canvasState Json?`, `PracticeSession.flowState Json?` columns.

- [ ] **Step 1: Add columns to the model**

In `prisma/schema.prisma`, inside `model PracticeSession` after `diagramSnapshot Json?`:

```prisma
  canvasState        Json?
  flowState          Json?
```

- [ ] **Step 2: Create the migration**

Run: `pnpm prisma migrate dev --name flow-v2-session-state`
Expected: migration created and applied; `pnpm prisma generate` runs automatically. (If no local DB is configured, run `pnpm prisma migrate diff` per project docs and flag it in the task report — do not skip the schema change.)

- [ ] **Step 3: Write the failing test**

Follow the existing mocking style in `src/app/actions/progress/__tests__/` if present; otherwise:

```typescript
// src/app/actions/progress/__tests__/flow-v2.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({ auth: () => mockAuth() }));

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { practiceSession: { findUnique: (...a: unknown[]) => mockFindUnique(...a), update: (...a: unknown[]) => mockUpdate(...a) } },
}));

import { syncFlowV2Session } from '../flow-v2';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('syncFlowV2Session', () => {
  it('rejects unauthenticated calls', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await syncFlowV2Session({ sessionId: 's1', flowState: { version: 2 } });
    expect(res).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects another user's session", async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockFindUnique.mockResolvedValue({ id: 's1', userId: 'someone-else' });
    const res = await syncFlowV2Session({ sessionId: 's1', flowState: { version: 2 } });
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updates only the provided fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockFindUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
    mockUpdate.mockResolvedValue({});
    const res = await syncFlowV2Session({ sessionId: 's1', flowState: { version: 2, currentStage: 3 } });
    expect(res).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { flowState: { version: 2, currentStage: 3 } },
    });
  });

  it('returns failure instead of throwing on DB errors', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockFindUnique.mockRejectedValue(new Error('db down'));
    const res = await syncFlowV2Session({ sessionId: 's1', canvasState: {} });
    expect(res.success).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm vitest run src/app/actions/progress/__tests__/flow-v2.test.ts`
Expected: FAIL — module `../flow-v2` not found.

- [ ] **Step 5: Implement the action**

```typescript
// src/app/actions/progress/flow-v2.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Persist Flow V2 session state (canvas scene and/or flow metadata) to the
 * PracticeSession row. Called on stage transitions, submits, and idle debounce.
 * Non-critical path: callers treat failure as "saved locally only".
 */
export async function syncFlowV2Session(input: {
  sessionId: string;
  canvasState?: unknown;
  flowState?: unknown;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const practiceSession = await prisma.practiceSession.findUnique({
      where: { id: input.sessionId },
      select: { id: true, userId: true },
    });
    if (!practiceSession || practiceSession.userId !== session.user.id) {
      return { success: false, error: 'Session not found' };
    }

    const data: Prisma.PracticeSessionUpdateInput = {};
    if (input.canvasState !== undefined) data.canvasState = input.canvasState as Prisma.InputJsonValue;
    if (input.flowState !== undefined) data.flowState = input.flowState as Prisma.InputJsonValue;
    if (Object.keys(data).length === 0) return { success: true };

    await prisma.practiceSession.update({ where: { id: input.sessionId }, data });
    return { success: true };
  } catch (error) {
    console.error('Failed to sync flow v2 session:', error);
    return { success: false, error: 'Failed to sync session' };
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run src/app/actions/progress/__tests__/flow-v2.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add prisma src/app/actions/progress/flow-v2.ts src/app/actions/progress/__tests__/flow-v2.test.ts
git commit -m "feat(flow-v2): PracticeSession canvasState/flowState columns + sync action"
```

---

### Task 4: Zustand flow store

**Files:**
- Create: `src/features/problem-flow-v2/store/flow-store.ts`
- Test: `src/features/problem-flow-v2/__tests__/flow-store.test.ts`

**Interfaces:**
- Consumes: `FlowStage`, `FlowStateV2`, `Seniority`, `StageStatus`, `FeedbackState` from `../types`.
- Produces:
  - `createFlowStore(init: { problemId: string; stages: FlowStage[]; initialFlowState?: FlowStateV2 | null }): FlowStore` (a zustand vanilla `StoreApi<FlowStoreState>`)
  - `FlowStoreState` fields: `problemId, stages, currentStage, stageStatuses, seniority, railOpen, explanationSeen, feedback, syncStatus, sessionId`
  - Actions: `goToStage(index)`, `nextStage()`, `prevStage()`, `setSeniority(s)`, `toggleRail()`, `dismissExplanation(stageId)`, `setFeedback(f)`, `markStage(stageId, status)`, `setSessionId(id)`, `setSyncStatus(s)`, `toFlowState(): FlowStateV2`
- Install: `zustand`.

- [ ] **Step 1: Install zustand**

Run: `pnpm add zustand`
Expected: added to `dependencies` in `package.json`.

- [ ] **Step 2: Write the failing test**

```typescript
// src/features/problem-flow-v2/__tests__/flow-store.test.ts
import { describe, it, expect } from 'vitest';
import { createFlowStore } from '../store/flow-store';
import { buildStageJourney } from '../lib/stage-journey';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: 'p1', title: 'T', slug: 't', context: 'c',
  functionalRequirements: [], nonFunctionalRequirements: [],
  difficulty: 'Hard', category: 'x', companies: [],
};
const stages = buildStageJourney(DEFAULT_PHASE_STEPS, problem);

function makeStore() {
  return createFlowStore({ problemId: 'p1', stages });
}

describe('flow store', () => {
  it('starts at stage 0, all stages untouched except active first', () => {
    const s = makeStore().getState();
    expect(s.currentStage).toBe(0);
    expect(s.stageStatuses[stages[0].id]).toBe('active');
    expect(s.stageStatuses[stages[1].id]).toBe('untouched');
  });

  it('nextStage advances, marks new stage active, clamps at end', () => {
    const store = makeStore();
    store.getState().nextStage();
    expect(store.getState().currentStage).toBe(1);
    expect(store.getState().stageStatuses[stages[1].id]).toBe('active');
    for (let i = 0; i < 20; i++) store.getState().nextStage();
    expect(store.getState().currentStage).toBe(stages.length - 1);
  });

  it('advancing past a stage never downgrades submitted/passed status', () => {
    const store = makeStore();
    store.getState().markStage(stages[0].id, 'passed');
    store.getState().goToStage(3);
    store.getState().goToStage(0);
    expect(store.getState().stageStatuses[stages[0].id]).toBe('passed');
  });

  it('prevStage clamps at 0', () => {
    const store = makeStore();
    store.getState().prevStage();
    expect(store.getState().currentStage).toBe(0);
  });

  it('dismissExplanation records the stage id once', () => {
    const store = makeStore();
    store.getState().dismissExplanation('fr');
    store.getState().dismissExplanation('fr');
    expect(store.getState().explanationSeen).toEqual(['fr']);
  });

  it('toFlowState round-trips through initialFlowState', () => {
    const store = makeStore();
    store.getState().setSeniority('senior');
    store.getState().goToStage(2);
    store.getState().markStage('fr', 'passed');
    const snapshot = store.getState().toFlowState();
    expect(snapshot.version).toBe(2);

    const resumed = createFlowStore({ problemId: 'p1', stages, initialFlowState: snapshot }).getState();
    expect(resumed.currentStage).toBe(2);
    expect(resumed.seniority).toBe('senior');
    expect(resumed.stageStatuses['fr']).toBe('passed');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/flow-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the store**

```typescript
// src/features/problem-flow-v2/store/flow-store.ts
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { FeedbackState, FlowStage, FlowStateV2, Seniority, StageStatus } from '../types';

export type SyncStatus = 'synced' | 'local' | 'syncing' | 'error';

export type FlowStoreState = {
  problemId: string;
  sessionId: string | null;
  stages: FlowStage[];
  currentStage: number;
  stageStatuses: Record<string, StageStatus>;
  seniority: Seniority;
  railOpen: boolean;
  explanationSeen: string[];
  feedback: FeedbackState;
  syncStatus: SyncStatus;

  goToStage(index: number): void;
  nextStage(): void;
  prevStage(): void;
  setSeniority(s: Seniority): void;
  toggleRail(): void;
  dismissExplanation(stageId: string): void;
  setFeedback(f: FeedbackState): void;
  markStage(stageId: string, status: StageStatus): void;
  setSessionId(id: string): void;
  setSyncStatus(s: SyncStatus): void;
  toFlowState(): FlowStateV2;
};

export type FlowStore = StoreApi<FlowStoreState>;

/** Statuses that must never be downgraded by navigation. */
const STICKY: StageStatus[] = ['submitted', 'passed'];

export function createFlowStore(init: {
  problemId: string;
  stages: FlowStage[];
  initialFlowState?: FlowStateV2 | null;
}): FlowStore {
  const prior = init.initialFlowState;
  const statuses: Record<string, StageStatus> = {};
  for (const stage of init.stages) {
    statuses[stage.id] = prior?.stageStatuses?.[stage.id] ?? 'untouched';
  }
  const startIndex = Math.min(Math.max(prior?.currentStage ?? 0, 0), init.stages.length - 1);
  const startId = init.stages[startIndex].id;
  if (!STICKY.includes(statuses[startId])) statuses[startId] = 'active';

  return createStore<FlowStoreState>((set, get) => ({
    problemId: init.problemId,
    sessionId: null,
    stages: init.stages,
    currentStage: startIndex,
    stageStatuses: statuses,
    seniority: prior?.seniority ?? 'mid',
    railOpen: true,
    explanationSeen: prior?.explanationSeen ?? [],
    feedback: { status: 'idle' },
    syncStatus: 'local',

    goToStage(index) {
      const { stages, stageStatuses } = get();
      const clamped = Math.min(Math.max(index, 0), stages.length - 1);
      const id = stages[clamped].id;
      const next = { ...stageStatuses };
      if (!STICKY.includes(next[id])) next[id] = 'active';
      set({ currentStage: clamped, stageStatuses: next, feedback: { status: 'idle' } });
    },
    nextStage() { get().goToStage(get().currentStage + 1); },
    prevStage() { get().goToStage(get().currentStage - 1); },
    setSeniority(seniority) { set({ seniority }); },
    toggleRail() { set((s) => ({ railOpen: !s.railOpen })); },
    dismissExplanation(stageId) {
      set((s) => s.explanationSeen.includes(stageId)
        ? s
        : { explanationSeen: [...s.explanationSeen, stageId] });
    },
    setFeedback(feedback) { set({ feedback }); },
    markStage(stageId, status) {
      set((s) => ({ stageStatuses: { ...s.stageStatuses, [stageId]: status } }));
    },
    setSessionId(sessionId) { set({ sessionId }); },
    setSyncStatus(syncStatus) { set({ syncStatus }); },
    toFlowState() {
      const s = get();
      return {
        version: 2,
        currentStage: s.currentStage,
        stageStatuses: s.stageStatuses,
        seniority: s.seniority,
        explanationSeen: s.explanationSeen,
        updatedAt: new Date().toISOString(),
      };
    },
  }));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/flow-store.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/features/problem-flow-v2
git commit -m "feat(flow-v2): zustand session store"
```

---

### Task 5: Canvas persistence (v2 key) + element tagging

**Files:**
- Create: `src/features/problem-flow-v2/lib/canvas-persistence.ts`
- Create: `src/features/problem-flow-v2/lib/element-tagging.ts`
- Test: `src/features/problem-flow-v2/__tests__/canvas-persistence.test.ts`
- Test: `src/features/problem-flow-v2/__tests__/element-tagging.test.ts`

**Interfaces:**
- Consumes: `stripFilesForPersistence`, `pickPersistedAppState` from `@/lib/diagram-persistence`; `ExcalidrawScene` from `@/types/diagram`.
- Produces:
  - `getCanvasV2Key(problemId: string): string` → `canvas-v2-${problemId}`
  - `saveCanvasV2(problemId: string, scene: ExcalidrawScene): void` / `loadCanvasV2(problemId: string): PersistedCanvasV2 | null` / `clearCanvasV2(problemId)`
  - `type PersistedCanvasV2 = { format: 'excalidraw-v2'; formatVersion: 1; scene: ExcalidrawScene; timestamp: string }`
  - `tagNewElements(elements: readonly ExcalidrawElement[], knownIds: Set<string>, stageId: StageId): { elements: ExcalidrawElement[]; changed: boolean }` — pure; tags untagged new elements with `customData.flowStage`.
  - `elementsForStage(elements: readonly ExcalidrawElement[], stageId: StageId, region: StageRegion): ExcalidrawElement[]` — tag match OR spatial containment fallback.

- [ ] **Step 1: Write failing tests**

```typescript
// src/features/problem-flow-v2/__tests__/canvas-persistence.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveCanvasV2, loadCanvasV2, clearCanvasV2, getCanvasV2Key } from '../lib/canvas-persistence';
import type { ExcalidrawScene } from '@/types/diagram';

const scene: ExcalidrawScene = {
  type: 'excalidraw',
  version: 2,
  elements: [{ id: 'a', type: 'rectangle', isDeleted: false } as never],
  appState: { theme: 'dark', zenModeEnabled: true } as never,
  files: { f1: { id: 'f1' } as never },
};

beforeEach(() => localStorage.clear());

describe('canvas v2 persistence', () => {
  it('uses the canvas-v2-<problemId> key', () => {
    expect(getCanvasV2Key('p1')).toBe('canvas-v2-p1');
  });

  it('round-trips a scene, stripping files and non-persisted appState', () => {
    saveCanvasV2('p1', scene);
    const loaded = loadCanvasV2('p1');
    expect(loaded).not.toBeNull();
    expect(loaded!.scene.files).toEqual({});
    expect(loaded!.scene.appState).toEqual({ theme: 'dark' });
    expect(loaded!.scene.elements).toHaveLength(1);
    expect(loaded!.timestamp).toBeTruthy();
  });

  it('purges corrupt payloads and returns null', () => {
    localStorage.setItem(getCanvasV2Key('p1'), '{not json');
    expect(loadCanvasV2('p1')).toBeNull();
    expect(localStorage.getItem(getCanvasV2Key('p1'))).toBeNull();
  });

  it('clearCanvasV2 removes the key', () => {
    saveCanvasV2('p1', scene);
    clearCanvasV2('p1');
    expect(loadCanvasV2('p1')).toBeNull();
  });
});
```

```typescript
// src/features/problem-flow-v2/__tests__/element-tagging.test.ts
import { describe, it, expect } from 'vitest';
import { tagNewElements, elementsForStage } from '../lib/element-tagging';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

const el = (id: string, extra: Record<string, unknown> = {}): ExcalidrawElement =>
  ({ id, type: 'rectangle', x: 0, y: 0, width: 10, height: 10, isDeleted: false, ...extra }) as never;

describe('tagNewElements', () => {
  it('tags unknown untagged elements with the active stage', () => {
    const { elements, changed } = tagNewElements([el('a')], new Set(), 'fr');
    expect(changed).toBe(true);
    expect(elements[0].customData).toEqual({ flowStage: 'fr' });
  });

  it('never retags elements that already carry a stage', () => {
    const tagged = el('a', { customData: { flowStage: 'nfr' } });
    const { elements, changed } = tagNewElements([tagged], new Set(), 'fr');
    expect(changed).toBe(false);
    expect(elements[0].customData).toEqual({ flowStage: 'nfr' });
  });

  it('ignores known ids (already processed)', () => {
    const { changed } = tagNewElements([el('a')], new Set(['a']), 'fr');
    expect(changed).toBe(false);
  });

  it('preserves unrelated customData when tagging', () => {
    const { elements } = tagNewElements([el('a', { customData: { foo: 1 } })], new Set(), 'fr');
    expect(elements[0].customData).toEqual({ foo: 1, flowStage: 'fr' });
  });
});

describe('elementsForStage', () => {
  const region = { x: 100, y: 100, w: 200, h: 200, zoom: 1 };

  it('includes tag matches wherever they are', () => {
    const a = el('a', { x: 9999, customData: { flowStage: 'fr' } });
    expect(elementsForStage([a], 'fr', region)).toHaveLength(1);
  });

  it('includes untagged elements spatially inside the region', () => {
    const a = el('a', { x: 150, y: 150 });
    expect(elementsForStage([a], 'fr', region)).toHaveLength(1);
  });

  it('excludes deleted elements and other-stage tags outside the region', () => {
    const deleted = el('d', { x: 150, y: 150, isDeleted: true });
    const other = el('o', { x: 9999, y: 9999, customData: { flowStage: 'nfr' } });
    expect(elementsForStage([deleted, other], 'fr', region)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/canvas-persistence.test.ts src/features/problem-flow-v2/__tests__/element-tagging.test.ts`
Expected: FAIL — modules not found. (If `localStorage` is undefined, check `vitest.config.ts` uses `environment: 'jsdom'` — the existing `diagram-persistence.test.ts` relies on it too.)

- [ ] **Step 3: Implement persistence**

```typescript
// src/features/problem-flow-v2/lib/canvas-persistence.ts
import { toast } from 'sonner';
import { pickPersistedAppState, stripFilesForPersistence } from '@/lib/diagram-persistence';
import type { ExcalidrawScene } from '@/types/diagram';

const FORMAT = 'excalidraw-v2' as const;
const FORMAT_VERSION = 1;

export type PersistedCanvasV2 = {
  format: typeof FORMAT;
  formatVersion: typeof FORMAT_VERSION;
  scene: ExcalidrawScene;
  timestamp: string;
};

export function getCanvasV2Key(problemId: string): string {
  return `canvas-v2-${problemId}`;
}

export function saveCanvasV2(problemId: string, scene: ExcalidrawScene): void {
  const payload: PersistedCanvasV2 = {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    scene: stripFilesForPersistence({ ...scene, appState: pickPersistedAppState(scene.appState) }),
    timestamp: new Date().toISOString(),
  };
  try {
    localStorage.setItem(getCanvasV2Key(problemId), JSON.stringify(payload));
  } catch (err) {
    const isQuota = err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22);
    if (isQuota) {
      toast.error('Canvas could not be saved — browser storage is full. Export your work.');
    } else {
      console.warn('canvas v2 save failed', err);
    }
  }
}

export function loadCanvasV2(problemId: string): PersistedCanvasV2 | null {
  const key = getCanvasV2Key(problemId);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedCanvasV2;
    if (parsed?.format === FORMAT && parsed.formatVersion === FORMAT_VERSION && parsed.scene) {
      return parsed;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function clearCanvasV2(problemId: string): void {
  localStorage.removeItem(getCanvasV2Key(problemId));
}
```

- [ ] **Step 4: Implement tagging**

```typescript
// src/features/problem-flow-v2/lib/element-tagging.ts
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { StageId, StageRegion } from '../types';

/**
 * Tag elements the user just created with the active stage. Pure function:
 * the caller applies the result via excalidrawAPI.updateScene only when
 * `changed` is true (guards against onChange loops).
 */
export function tagNewElements(
  elements: readonly ExcalidrawElement[],
  knownIds: Set<string>,
  stageId: StageId,
): { elements: ExcalidrawElement[]; changed: boolean } {
  let changed = false;
  const result = elements.map((el) => {
    if (knownIds.has(el.id)) return el;
    const existing = (el.customData ?? {}) as Record<string, unknown>;
    if (existing.flowStage) return el;
    changed = true;
    return { ...el, customData: { ...existing, flowStage: stageId } } as ExcalidrawElement;
  });
  return { elements: result, changed };
}

/**
 * Elements belonging to a stage: explicit tag match, or — fallback for
 * pasted/duplicated/library elements that missed tagging — untagged elements
 * whose top-left corner sits inside the stage's home region.
 */
export function elementsForStage(
  elements: readonly ExcalidrawElement[],
  stageId: StageId,
  region: StageRegion,
): ExcalidrawElement[] {
  return elements.filter((el) => {
    if (el.isDeleted) return false;
    const tag = (el.customData as Record<string, unknown> | undefined)?.flowStage;
    if (tag) return tag === stageId;
    return (
      el.x >= region.x && el.x <= region.x + region.w &&
      el.y >= region.y && el.y <= region.y + region.h
    );
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/canvas-persistence.test.ts src/features/problem-flow-v2/__tests__/element-tagging.test.ts`
Expected: PASS (7 tests total).

- [ ] **Step 6: Commit**

```bash
git add src/features/problem-flow-v2
git commit -m "feat(flow-v2): single-scene canvas persistence and per-stage element tagging"
```

---

### Task 6: Canvas → text serializer

**Files:**
- Create: `src/features/problem-flow-v2/lib/canvas-serializer.ts`
- Test: `src/features/problem-flow-v2/__tests__/canvas-serializer.test.ts`

**Interfaces:**
- Consumes: `elementsForStage` from `./element-tagging`; `ExcalidrawElement` types.
- Produces: `serializeStageContent(allElements: readonly ExcalidrawElement[], stage: FlowStage): string | null` — structured text for the evaluate API; `null` when the stage has no content.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/problem-flow-v2/__tests__/canvas-serializer.test.ts
import { describe, it, expect } from 'vitest';
import { serializeStageContent } from '../lib/canvas-serializer';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { FlowStage } from '../types';

const stage = {
  id: 'hld',
  label: 'High-level design',
  region: { x: 0, y: 0, w: 5000, h: 5000, zoom: 1 },
} as FlowStage;

const base = { x: 10, y: 10, width: 100, height: 50, isDeleted: false, customData: { flowStage: 'hld' } };
const el = (o: Record<string, unknown>): ExcalidrawElement => ({ ...base, ...o }) as never;

describe('serializeStageContent', () => {
  it('returns null for an empty stage', () => {
    expect(serializeStageContent([], stage)).toBeNull();
  });

  it('lists labeled shapes as components', () => {
    const rect = el({ id: 'r1', type: 'rectangle' });
    const label = el({ id: 't1', type: 'text', text: 'API gateway', containerId: 'r1' });
    const out = serializeStageContent([rect, label], stage)!;
    expect(out).toContain('rectangle "API gateway"');
  });

  it('renders arrows between bound shapes as connections', () => {
    const a = el({ id: 'a', type: 'rectangle' });
    const aText = el({ id: 'at', type: 'text', text: 'Client', containerId: 'a' });
    const b = el({ id: 'b', type: 'rectangle' });
    const bText = el({ id: 'bt', type: 'text', text: 'CDN', containerId: 'b' });
    const arrow = el({
      id: 'ar', type: 'arrow',
      startBinding: { elementId: 'a' }, endBinding: { elementId: 'b' },
    });
    const out = serializeStageContent([a, aText, b, bText, arrow], stage)!;
    expect(out).toContain('"Client" -> "CDN"');
  });

  it('includes standalone text verbatim as notes', () => {
    const note = el({ id: 'n', type: 'text', text: 'p95 < 200ms' });
    expect(serializeStageContent([note], stage)!).toContain('note: p95 < 200ms');
  });

  it('excludes elements tagged for other stages when outside the region', () => {
    const other = el({ id: 'o', type: 'text', text: 'secret', x: 9999, y: 9999, customData: { flowStage: 'fr' } });
    expect(serializeStageContent([other], { ...stage, region: { x: 0, y: 0, w: 10, h: 10, zoom: 1 } })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/canvas-serializer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the serializer**

```typescript
// src/features/problem-flow-v2/lib/canvas-serializer.ts
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { elementsForStage } from './element-tagging';
import type { FlowStage } from '../types';

const CONNECTOR_TYPES = new Set(['arrow', 'line']);

type Bound = { elementId?: string } | null;

function textOf(el: ExcalidrawElement): string | undefined {
  const t = (el as { text?: string }).text;
  return t?.trim() || undefined;
}

/**
 * Convert one stage's canvas content into structured text for the evaluate
 * API. Mirrors the intent of buildDiagramDescription() but adds arrow
 * connectivity ("A" -> "B") so the AI can grade architecture, not just
 * inventory shapes.
 */
export function serializeStageContent(
  allElements: readonly ExcalidrawElement[],
  stage: FlowStage,
): string | null {
  const els = elementsForStage(allElements, stage.id, stage.region);
  if (els.length === 0) return null;

  // Bound-text labels: containerId -> label
  const labelByContainer = new Map<string, string>();
  for (const el of els) {
    if (el.type === 'text') {
      const containerId = (el as { containerId?: string }).containerId;
      const t = textOf(el);
      if (containerId && t) labelByContainer.set(containerId, t);
    }
  }

  const labelFor = (id: string): string | undefined => {
    if (labelByContainer.has(id)) return labelByContainer.get(id);
    const target = els.find((e) => e.id === id);
    return target ? textOf(target) : undefined;
  };

  const lines: string[] = [];

  // Components: non-connector, non-label shapes
  for (const el of els) {
    if (CONNECTOR_TYPES.has(el.type)) continue;
    if (el.type === 'text' && (el as { containerId?: string }).containerId) continue;
    if (el.type === 'text') continue; // standalone text handled below
    const label = labelByContainer.get(el.id);
    lines.push(label ? `- ${el.type} "${label}"` : `- ${el.type}`);
  }

  // Connections: arrows/lines with bindings
  for (const el of els) {
    if (!CONNECTOR_TYPES.has(el.type)) continue;
    const start = (el as { startBinding?: Bound }).startBinding?.elementId;
    const end = (el as { endBinding?: Bound }).endBinding?.elementId;
    if (start && end) {
      const from = labelFor(start) ?? 'unlabeled';
      const to = labelFor(end) ?? 'unlabeled';
      const arrowLabel = labelByContainer.get(el.id);
      lines.push(`- connection: "${from}" -> "${to}"${arrowLabel ? ` (${arrowLabel})` : ''}`);
    }
  }

  // Standalone text: the user's written answers — verbatim
  for (const el of els) {
    if (el.type === 'text' && !(el as { containerId?: string }).containerId) {
      const t = textOf(el);
      if (t) lines.push(`- note: ${t}`);
    }
  }

  if (lines.length === 0) return null;
  return `Canvas content for "${stage.label}":\n${lines.join('\n')}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/canvas-serializer.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/problem-flow-v2
git commit -m "feat(flow-v2): canvas-to-text serializer for AI evaluation"
```

---

### Task 7: Region seeding + camera helpers

**Files:**
- Create: `src/features/problem-flow-v2/lib/canvas-seed.ts`
- Create: `src/features/problem-flow-v2/lib/camera.ts`
- Test: `src/features/problem-flow-v2/__tests__/canvas-seed.test.ts`

**Interfaces:**
- Consumes: `FlowStage`, `StageRegion`; `SystemDesignProblem`.
- Produces:
  - `buildStageHeaderElement(stage: FlowStage): ExcalidrawElement` — locked text header at the region anchor, `customData: { flowStage, flowSeed: true }`.
  - `buildProblemCardElements(problem: SystemDesignProblem, region: StageRegion): ExcalidrawElement[]` — locked rectangle + bound title/context text, `flowSeed: true`.
  - `hasSeedForStage(elements, stageId): boolean`
  - `scrollAppStateForRegion(region: StageRegion, viewport: { width: number; height: number }): { scrollX: number; scrollY: number; zoom: { value: number } }` — pure math consumed by CanvasStage.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/problem-flow-v2/__tests__/canvas-seed.test.ts
import { describe, it, expect } from 'vitest';
import { buildStageHeaderElement, buildProblemCardElements, hasSeedForStage } from '../lib/canvas-seed';
import { scrollAppStateForRegion } from '../lib/camera';
import type { FlowStage } from '../types';

const stage = {
  id: 'fr',
  label: 'Functional requirements',
  region: { x: 690, y: 150, w: 520, h: 240, zoom: 1 },
} as FlowStage;

describe('canvas seeding', () => {
  it('builds a locked, tagged header at the region anchor', () => {
    const header = buildStageHeaderElement(stage);
    expect(header.type).toBe('text');
    expect(header.locked).toBe(true);
    expect(header.x).toBe(690);
    expect(header.y).toBe(150);
    expect(header.customData).toMatchObject({ flowStage: 'fr', flowSeed: true });
    expect((header as { text?: string }).text).toBe('Functional requirements');
  });

  it('hasSeedForStage detects an existing seed', () => {
    const header = buildStageHeaderElement(stage);
    expect(hasSeedForStage([header], 'fr')).toBe(true);
    expect(hasSeedForStage([header], 'nfr')).toBe(false);
    expect(hasSeedForStage([{ ...header, isDeleted: true }], 'fr')).toBe(true); // deleted seed still counts — never re-seed
  });

  it('problem card is a locked container with bound text', () => {
    const els = buildProblemCardElements(
      { id: 'p', title: 'Design YouTube', slug: 's', context: 'ctx', functionalRequirements: [], nonFunctionalRequirements: [], difficulty: 'Hard', category: '', companies: [] },
      { x: 120, y: 170, w: 470, h: 320, zoom: 1 },
    );
    expect(els).toHaveLength(2);
    expect(els[0].type).toBe('rectangle');
    expect(els[0].locked).toBe(true);
    expect((els[1] as { containerId?: string }).containerId).toBe(els[0].id);
    expect((els[1] as { text?: string }).text).toContain('Design YouTube');
  });
});

describe('scrollAppStateForRegion', () => {
  it('centers the region in the viewport at the region zoom', () => {
    const region = { x: 1000, y: 500, w: 400, h: 200, zoom: 1 };
    const out = scrollAppStateForRegion(region, { width: 1600, height: 900 });
    // Region center (1200, 600) should map to viewport center (800, 450):
    // screen = (canvas + scroll) * zoom  =>  scroll = center/zoom - canvasCenter
    expect(out.scrollX).toBe(800 / 1 - 1200);
    expect(out.scrollY).toBe(450 / 1 - 600);
    expect(out.zoom.value).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/canvas-seed.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement seeding**

Excalidraw elements need a full skeleton to render; build them via a local factory (avoids depending on `@excalidraw/excalidraw` internals in tests):

```typescript
// src/features/problem-flow-v2/lib/canvas-seed.ts
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { SystemDesignProblem } from '@/types';
import type { FlowStage, StageId, StageRegion } from '../types';

let seedCounter = 0;
function seedId(prefix: string): string {
  seedCounter += 1;
  return `flow-seed-${prefix}-${seedCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Minimal valid Excalidraw element skeleton (v0.18 shape). */
function baseElement(overrides: Record<string, unknown>): ExcalidrawElement {
  return {
    id: seedId('el'),
    type: 'rectangle',
    x: 0, y: 0, width: 100, height: 40,
    angle: 0,
    strokeColor: '#8a8d96',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    ...overrides,
  } as unknown as ExcalidrawElement;
}

/** Locked section-header text at the stage's region anchor. */
export function buildStageHeaderElement(stage: FlowStage): ExcalidrawElement {
  return baseElement({
    type: 'text',
    x: stage.region.x,
    y: stage.region.y,
    width: 320,
    height: 32,
    text: stage.label,
    originalText: stage.label,
    fontSize: 24,
    fontFamily: 1,
    textAlign: 'left',
    verticalAlign: 'top',
    containerId: null,
    strokeColor: '#e6e8ee',
    lineHeight: 1.25,
    locked: true,
    customData: { flowStage: stage.id, flowSeed: true },
  });
}

/** Locked problem card (rectangle + bound text) for the understanding stage. */
export function buildProblemCardElements(
  problem: SystemDesignProblem,
  region: StageRegion,
): ExcalidrawElement[] {
  const rect = baseElement({
    type: 'rectangle',
    x: region.x,
    y: region.y,
    width: region.w,
    height: region.h,
    strokeColor: '#8f95f2',
    locked: true,
    roundness: { type: 3 },
    customData: { flowStage: 'understanding' satisfies StageId, flowSeed: true },
  });
  const text = baseElement({
    type: 'text',
    x: region.x + 20,
    y: region.y + 20,
    width: region.w - 40,
    height: region.h - 40,
    text: `${problem.title}\n\n${problem.context}`,
    originalText: `${problem.title}\n\n${problem.context}`,
    fontSize: 16,
    fontFamily: 1,
    textAlign: 'left',
    verticalAlign: 'top',
    containerId: rect.id,
    strokeColor: '#b3b6bf',
    lineHeight: 1.25,
    locked: true,
    customData: { flowStage: 'understanding' satisfies StageId, flowSeed: true },
  });
  (rect as { boundElements: unknown }).boundElements = [{ id: text.id, type: 'text' }];
  return [rect, text];
}

/** True if the stage was ever seeded (deleted seeds count — never re-seed). */
export function hasSeedForStage(
  elements: readonly ExcalidrawElement[],
  stageId: StageId,
): boolean {
  return elements.some((el) => {
    const cd = el.customData as Record<string, unknown> | undefined;
    return cd?.flowSeed === true && cd?.flowStage === stageId;
  });
}
```

```typescript
// src/features/problem-flow-v2/lib/camera.ts
import type { StageRegion } from '../types';

/**
 * Excalidraw screen mapping: screen = (canvas + scroll) * zoom.
 * Solve scroll so the region center lands on the viewport center.
 */
export function scrollAppStateForRegion(
  region: StageRegion,
  viewport: { width: number; height: number },
): { scrollX: number; scrollY: number; zoom: { value: number } } {
  const zoom = region.zoom;
  const canvasCenterX = region.x + region.w / 2;
  const canvasCenterY = region.y + region.h / 2;
  return {
    scrollX: viewport.width / 2 / zoom - canvasCenterX,
    scrollY: viewport.height / 2 / zoom - canvasCenterY,
    zoom: { value: zoom },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/canvas-seed.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/problem-flow-v2
git commit -m "feat(flow-v2): stage seeding and camera math"
```

---

### Task 8: CanvasStage component

**Files:**
- Create: `src/features/problem-flow-v2/components/CanvasStage.tsx`

**Interfaces:**
- Consumes: everything from Tasks 5–7; `ExcalidrawImperativeAPI` from `@excalidraw/excalidraw/types`; `FlowStore` (read via props, not context — keeps this component testable).
- Produces:
  ```typescript
  type CanvasStageProps = {
    problemId: string;
    problem: SystemDesignProblem;
    stages: FlowStage[];
    currentStageIndex: number;
    /** DB copy loaded server-side; wins over localStorage when newer. */
    initialCanvasState?: { scene: ExcalidrawScene; timestamp?: string } | null;
    onApiReady(api: ExcalidrawImperativeAPI): void;
    onSceneChange(scene: ExcalidrawScene): void;   // debounced upstream consumers
  };
  ```
  The parent keeps the `ExcalidrawImperativeAPI` ref for serialization/PNG export.

- [ ] **Step 1: Implement the component**

Follow the dynamic-import + hydration-guard pattern from `src/components/DiagramCanvas.tsx` (read it first — it documents the pitfalls). Implementation:

```tsx
// src/features/problem-flow-v2/components/CanvasStage.tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef } from 'react';
import '@excalidraw/excalidraw/index.css';
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawScene } from '@/types/diagram';
import type { SystemDesignProblem } from '@/types';
import { loadCanvasV2, saveCanvasV2 } from '../lib/canvas-persistence';
import { tagNewElements } from '../lib/element-tagging';
import { buildProblemCardElements, buildStageHeaderElement, hasSeedForStage } from '../lib/canvas-seed';
import { scrollAppStateForRegion } from '../lib/camera';
import type { FlowStage } from '../types';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false },
);

const SAVE_DEBOUNCE_MS = 1000;

export type CanvasStageProps = {
  problemId: string;
  problem: SystemDesignProblem;
  stages: FlowStage[];
  currentStageIndex: number;
  initialCanvasState?: { scene: ExcalidrawScene; timestamp?: string } | null;
  onApiReady(api: ExcalidrawImperativeAPI): void;
  onSceneChange(scene: ExcalidrawScene): void;
};

function toScene(
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
): ExcalidrawScene {
  return { type: 'excalidraw', version: 2, elements, appState, files };
}

export default function CanvasStage({
  problemId, problem, stages, currentStageIndex,
  initialCanvasState, onApiReady, onSceneChange,
}: CanvasStageProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedRef = useRef(false);

  const currentStage = stages[currentStageIndex];

  /** Resolve the freshest starting scene: DB copy vs localStorage cache. */
  const resolveInitialScene = useCallback((): ExcalidrawScene | null => {
    const local = loadCanvasV2(problemId);
    const db = initialCanvasState ?? null;
    if (local && db) {
      const localTs = Date.parse(local.timestamp) || 0;
      const dbTs = db.timestamp ? Date.parse(db.timestamp) || 0 : 0;
      return dbTs > localTs ? db.scene : local.scene;
    }
    return local?.scene ?? db?.scene ?? null;
  }, [problemId, initialCanvasState]);

  const seedStageIfNeeded = useCallback((api: ExcalidrawImperativeAPI, stage: FlowStage) => {
    const elements = api.getSceneElementsIncludingDeleted();
    if (hasSeedForStage(elements, stage.id)) return;
    const seeds = stage.id === 'understanding'
      ? buildProblemCardElements(problem, stage.region)
      : [buildStageHeaderElement(stage)];
    seeds.forEach((el) => knownIdsRef.current.add(el.id));
    api.updateScene({ elements: [...elements, ...seeds] });
  }, [problem]);

  const panToStage = useCallback((api: ExcalidrawImperativeAPI, stage: FlowStage) => {
    const container = document.querySelector('.excalidraw')?.getBoundingClientRect();
    const viewport = { width: container?.width ?? window.innerWidth, height: container?.height ?? window.innerHeight };
    api.updateScene({ appState: scrollAppStateForRegion(stage.region, viewport) });
  }, []);

  // Stage changed: seed + pan (also runs once on mount after hydration).
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !hasHydratedRef.current || !currentStage) return;
    seedStageIfNeeded(api, currentStage);
    panToStage(api, currentStage);
  }, [currentStageIndex, currentStage, seedStageIfNeeded, panToStage]);

  const handleApi = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;

    const scene = resolveInitialScene();
    if (scene) {
      // Hydrate known ids BEFORE loading, so restored elements are never retagged.
      scene.elements.forEach((el) => knownIdsRef.current.add(el.id));
      api.updateScene({ elements: scene.elements as ExcalidrawElement[] });
    }
    hasHydratedRef.current = true;
    if (currentStage) {
      seedStageIfNeeded(api, currentStage);
      panToStage(api, currentStage);
    }
    onApiReady(api);
  }, [resolveInitialScene, currentStage, seedStageIfNeeded, panToStage, onApiReady]);

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      if (!hasHydratedRef.current || !currentStage) return;

      // Tag newly created elements with the active stage (guarded to avoid loops).
      const { elements: tagged, changed } = tagNewElements(elements, knownIdsRef.current, currentStage.id);
      elements.forEach((el) => knownIdsRef.current.add(el.id));
      if (changed && apiRef.current) {
        apiRef.current.updateScene({ elements: tagged });
        return; // updateScene refires onChange; persist on that pass
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const scene = toScene(elements, appState, files);
        saveCanvasV2(problemId, scene);
        onSceneChange(scene);
      }, SAVE_DEBOUNCE_MS);
    },
    [problemId, currentStage, onSceneChange],
  );

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  return (
    <div className="absolute inset-0" data-testid="flow-v2-canvas">
      <Excalidraw
        excalidrawAPI={handleApi}
        onChange={handleChange}
        theme="dark"
        UIOptions={{
          canvasActions: {
            loadScene: false, saveToActiveFile: false, export: false, toggleTheme: false,
          },
        }}
        initialData={{ appState: { viewBackgroundColor: '#0e0f12' } }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm tsc --noEmit`
Expected: no new errors. (Component behavior is verified end-to-end in Task 12; the logic it composes — tagging, seeding, persistence, camera — is already unit-tested.)

- [ ] **Step 3: Commit**

```bash
git add src/features/problem-flow-v2/components/CanvasStage.tsx
git commit -m "feat(flow-v2): CanvasStage — single-scene Excalidraw wrapper with tagging, seeding, camera"
```

---

### Task 9: AI feedback hook (`useStageFeedback`)

**Files:**
- Create: `src/features/problem-flow-v2/lib/use-stage-feedback.ts`
- Test: `src/features/problem-flow-v2/__tests__/use-stage-feedback.test.ts`

**Interfaces:**
- Consumes: `serializeStageContent`; `recordStepSubmission` from `@/app/actions/progress`; `FlowStore`; evaluate API contract `POST /api/ai/evaluate` body `{ problem: slug, phase, phaseKey, subStep, userAnswer, problemDetails }` → `{ feedback: FeedbackResult }`, error body `{ error: string, code?: 'ai_unavailable' | 'ai_rate_limited' | 'ai_failed' }`.
- Produces:
  ```typescript
  function useStageFeedback(args: {
    store: FlowStore;
    problem: SystemDesignProblem;
    getElements(): readonly ExcalidrawElement[];
  }): {
    submitForReview(): Promise<void>;   // evaluates + records StepSubmission + sets stage status
    readMyCanvas(): Promise<void>;      // evaluates only — nothing recorded
  }
  ```
- Also exported for testing: `buildEvaluatePayload(stage: FlowStage, problem: SystemDesignProblem, serialized: string, seniority: Seniority)`.

- [ ] **Step 1: Write the failing test** (test the pure payload builder + the fetch orchestration with a mocked `fetch` and mocked server action)

```typescript
// src/features/problem-flow-v2/__tests__/use-stage-feedback.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRecord = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/app/actions/progress', () => ({
  recordStepSubmission: (...a: unknown[]) => mockRecord(...a),
}));

import { buildEvaluatePayload, runEvaluation } from '../lib/use-stage-feedback';
import { buildStageJourney } from '../lib/stage-journey';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: 'p1', title: 'Design YouTube', slug: 'design-youtube', context: 'c',
  functionalRequirements: [], nonFunctionalRequirements: [],
  difficulty: 'Hard', category: 'x', companies: [],
};
const stages = buildStageJourney(DEFAULT_PHASE_STEPS, problem);
const hld = stages.find((s) => s.id === 'hld')!;

beforeEach(() => vi.clearAllMocks());

describe('buildEvaluatePayload', () => {
  it('routes through the first source step and appends seniority context', () => {
    const p = buildEvaluatePayload(hld, problem, 'Canvas content...', 'senior');
    expect(p.problem).toBe('design-youtube');
    expect(p.phase).toBe(hld.sourceSteps[0].step.phase);
    expect(p.phaseKey).toBe(hld.sourceSteps[0].phaseKey);
    expect(p.subStep).toBe(hld.sourceSteps[0].step.subStep);
    expect(p.userAnswer).toContain('Canvas content...');
    expect(p.userAnswer).toContain('[Candidate seniority: senior');
    expect(p.problemDetails).toBe(problem);
  });
});

describe('runEvaluation', () => {
  const feedback = { score: 8, strengths: ['a'], weaknesses: [], missed: [], isAcceptable: true };

  it('returns feedback and records a submission when record=true', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ feedback }) }) as never;
    const result = await runEvaluation({
      stage: hld, problem, serialized: 'stuff', seniority: 'mid',
      record: { sessionId: 's1' },
    });
    expect(result).toEqual({ ok: true, feedback });
    expect(mockRecord).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 's1',
      problemId: 'p1',
      stepId: hld.sourceSteps[0].stepKey,
      phase: hld.sourceSteps[0].step.phase,
      score: 8,
      isPassing: true,
      problemSlug: 'design-youtube',
    }));
  });

  it('does not record when record is omitted (read my canvas)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ feedback }) }) as never;
    await runEvaluation({ stage: hld, problem, serialized: 'stuff', seniority: 'mid' });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it('surfaces typed API errors without recording', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 503, json: async () => ({ error: 'AI unavailable', code: 'ai_unavailable' }),
    }) as never;
    const result = await runEvaluation({ stage: hld, problem, serialized: 'x', seniority: 'mid', record: { sessionId: 's1' } });
    expect(result).toEqual({ ok: false, code: 'ai_unavailable', message: 'AI unavailable' });
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/use-stage-feedback.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/features/problem-flow-v2/lib/use-stage-feedback.ts
'use client';

import { useCallback } from 'react';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { SystemDesignProblem } from '@/types';
import { recordStepSubmission } from '@/app/actions/progress';
import { serializeStageContent } from './canvas-serializer';
import type { FlowStore } from '../store/flow-store';
import type { FeedbackResult, FlowStage, Seniority } from '../types';

export function buildEvaluatePayload(
  stage: FlowStage,
  problem: SystemDesignProblem,
  serialized: string,
  seniority: Seniority,
) {
  const source = stage.sourceSteps[0];
  return {
    problem: problem.slug,
    phase: source.step.phase,
    phaseKey: source.phaseKey,
    subStep: source.step.subStep,
    userAnswer: `${serialized}\n\n[Candidate seniority: ${seniority} — calibrate feedback depth accordingly]`,
    problemDetails: problem,
  };
}

export type EvaluationOutcome =
  | { ok: true; feedback: FeedbackResult }
  | { ok: false; code: string; message: string };

/** Shared evaluation pipeline for "Submit for Review" and "Read my canvas". */
export async function runEvaluation(args: {
  stage: FlowStage;
  problem: SystemDesignProblem;
  serialized: string;
  seniority: Seniority;
  /** Present = full submission (recorded); absent = read-only feedback. */
  record?: { sessionId: string };
}): Promise<EvaluationOutcome> {
  const payload = buildEvaluatePayload(args.stage, args.problem, args.serialized, args.seniority);

  const res = await fetch('/api/ai/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.feedback) {
    return { ok: false, code: data.code ?? 'ai_failed', message: data.error ?? 'Evaluation failed' };
  }
  const feedback = data.feedback as FeedbackResult;

  if (args.record) {
    const source = args.stage.sourceSteps[0];
    await recordStepSubmission({
      sessionId: args.record.sessionId,
      problemId: args.problem.id,
      stepId: source.stepKey,
      phase: source.step.phase,
      content: args.serialized,
      feedback: JSON.stringify(feedback),
      score: feedback.score ?? null,
      isPassing: !!feedback.isAcceptable,
      problemSlug: args.problem.slug,
    });
  }
  return { ok: true, feedback };
}

export function useStageFeedback(args: {
  store: FlowStore;
  problem: SystemDesignProblem;
  getElements(): readonly ExcalidrawElement[];
}) {
  const { store, problem, getElements } = args;

  const evaluate = useCallback(async (recorded: boolean) => {
    const s = store.getState();
    const stage = s.stages[s.currentStage];
    if (stage.sourceSteps.length === 0) return; // understanding: nothing to evaluate

    const serialized = serializeStageContent(getElements(), stage);
    if (!serialized) {
      store.getState().setFeedback({
        status: 'error', code: 'empty',
        message: 'Nothing on the canvas for this step yet — sketch or write something first.',
      });
      return;
    }

    store.getState().setFeedback({ status: 'loading' });
    try {
      const outcome = await runEvaluation({
        stage, problem, serialized, seniority: s.seniority,
        record: recorded && s.sessionId ? { sessionId: s.sessionId } : undefined,
      });
      if (outcome.ok) {
        store.getState().setFeedback({ status: 'done', result: outcome.feedback, recorded });
        if (recorded) {
          store.getState().markStage(stage.id, outcome.feedback.isAcceptable ? 'passed' : 'submitted');
        }
      } else {
        store.getState().setFeedback({ status: 'error', code: outcome.code, message: outcome.message });
      }
    } catch {
      store.getState().setFeedback({ status: 'error', code: 'network', message: 'Could not reach the AI service. Try again.' });
    }
  }, [store, problem, getElements]);

  return {
    submitForReview: useCallback(() => evaluate(true), [evaluate]),
    readMyCanvas: useCallback(() => evaluate(false), [evaluate]),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/use-stage-feedback.test.ts`
Expected: PASS (4 tests). Note: if `recordStepSubmission` is not re-exported from `@/app/actions/progress` (check `src/app/actions/progress/index.ts`), import from `@/app/actions/progress/submissions` instead — match whichever the old flow (`StepByStepChat.tsx` imports) uses.

- [ ] **Step 5: Commit**

```bash
git add src/features/problem-flow-v2
git commit -m "feat(flow-v2): stage evaluation pipeline reusing /api/ai/evaluate"
```

---

### Task 10: UI chrome — GuideRail, StageDock, StageExplanationCard, QuietTimer, Breadcrumb

**Files:**
- Create: `src/features/problem-flow-v2/components/GuideRail.tsx`
- Create: `src/features/problem-flow-v2/components/StageDock.tsx`
- Create: `src/features/problem-flow-v2/components/StageExplanationCard.tsx`
- Create: `src/features/problem-flow-v2/components/QuietTimer.tsx`
- Create: `src/features/problem-flow-v2/components/Breadcrumb.tsx`
- Create: `src/features/problem-flow-v2/store/store-context.tsx`
- Test: `src/features/problem-flow-v2/__tests__/stage-dock.test.tsx`

**Interfaces:**
- Consumes: `FlowStore` via new context; `useStageFeedback` handles; `togglePracticeTimer` from `@/app/actions/progress` (same import path the old `TimerWidget` uses — check it).
- Produces:
  - `FlowStoreProvider({ store, children })` + `useFlowStore<T>(selector: (s: FlowStoreState) => T): T` (via `zustand`'s `useStore`)
  - Components: `GuideRail({ onSubmit, onReadCanvas })`, `StageDock({ onSubmit })`, `StageExplanationCard()`, `QuietTimer({ problemId, startedAt, isTimerRunning, totalPausedSeconds, lastPausedAt })`, `Breadcrumb({ problemTitle })`.

- [ ] **Step 1: Store context**

```tsx
// src/features/problem-flow-v2/store/store-context.tsx
'use client';

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { FlowStore, FlowStoreState } from './flow-store';

const FlowStoreContext = createContext<FlowStore | null>(null);

export function FlowStoreProvider({ store, children }: { store: FlowStore; children: React.ReactNode }) {
  return <FlowStoreContext.Provider value={store}>{children}</FlowStoreContext.Provider>;
}

export function useFlowStoreApi(): FlowStore {
  const store = useContext(FlowStoreContext);
  if (!store) throw new Error('useFlowStore must be used inside FlowStoreProvider');
  return store;
}

export function useFlowStore<T>(selector: (s: FlowStoreState) => T): T {
  return useStore(useFlowStoreApi(), selector);
}
```

- [ ] **Step 2: Write the failing StageDock test**

```tsx
// src/features/problem-flow-v2/__tests__/stage-dock.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageDock from '../components/StageDock';
import { FlowStoreProvider } from '../store/store-context';
import { createFlowStore } from '../store/flow-store';
import { buildStageJourney } from '../lib/stage-journey';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: 'p1', title: 'T', slug: 't', context: 'c',
  functionalRequirements: [], nonFunctionalRequirements: [],
  difficulty: 'Hard', category: 'x', companies: [],
};
const stages = buildStageJourney(DEFAULT_PHASE_STEPS, problem);

function setup() {
  const store = createFlowStore({ problemId: 'p1', stages });
  render(
    <FlowStoreProvider store={store}>
      <StageDock onSubmit={vi.fn()} />
    </FlowStoreProvider>,
  );
  return store;
}

describe('StageDock', () => {
  it('shows current stage label, budget and position', () => {
    setup();
    expect(screen.getByText(/Problem understanding/)).toBeTruthy();
    expect(screen.getByText(new RegExp(`1/${stages.length}`))).toBeTruthy();
  });

  it('next button advances the stage', () => {
    const store = setup();
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(store.getState().currentStage).toBe(1);
  });

  it('ArrowRight/ArrowLeft navigate stages', () => {
    const store = setup();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(store.getState().currentStage).toBe(1);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(store.getState().currentStage).toBe(0);
  });

  it('arrow keys are ignored while typing (canvas text editing)', () => {
    const store = setup();
    const input = document.createElement('textarea');
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(store.getState().currentStage).toBe(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/stage-dock.test.tsx`
Expected: FAIL — components not found.

- [ ] **Step 4: Implement the components**

```tsx
// src/features/problem-flow-v2/components/StageDock.tsx
'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../store/store-context';

/** Bottom-center stage navigation: prev/next, per-stage ticks, quiet label. */
export default function StageDock({ onSubmit }: { onSubmit(): void }) {
  const stages = useFlowStore((s) => s.stages);
  const current = useFlowStore((s) => s.currentStage);
  const statuses = useFlowStore((s) => s.stageStatuses);
  const goToStage = useFlowStore((s) => s.goToStage);
  const nextStage = useFlowStore((s) => s.nextStage);
  const prevStage = useFlowStore((s) => s.prevStage);
  const feedbackStatus = useFlowStore((s) => s.feedback.status);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Don't steal arrows from canvas text editing or any input.
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) return;
      if (e.key === 'ArrowRight') nextStage();
      if (e.key === 'ArrowLeft') prevStage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextStage, prevStage]);

  const stage = stages[current];
  const isSubmittable = stage.sourceSteps.length > 0;

  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-white/[.07] bg-[#16171d] px-2.5 py-1 shadow-lg shadow-black/30">
        <button aria-label="Previous step" onClick={prevStage}
          className="px-1.5 py-1 text-sm text-[#6b6e77] hover:text-[#e8e9eb]">
          <ChevronLeft size={14} />
        </button>
        {stages.map((s, i) => (
          <button key={s.id} title={s.label} aria-label={`Go to ${s.label}`} onClick={() => goToStage(i)} className="px-[3px] py-2">
            <span className={`block h-1 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-[#8f95f2]'
              : statuses[s.id] === 'passed' ? 'w-3 bg-[#8f95f2]/50'
              : statuses[s.id] === 'submitted' ? 'w-3 bg-[#8f95f2]/30'
              : 'w-3 bg-white/15'
            }`} />
          </button>
        ))}
        <button aria-label="Next step" onClick={nextStage}
          className="px-1.5 py-1 text-sm text-[#6b6e77] hover:text-[#e8e9eb]">
          <ChevronRight size={14} />
        </button>
        {isSubmittable && (
          <button onClick={onSubmit} disabled={feedbackStatus === 'loading'}
            className="ml-1 rounded-lg bg-[#e8e9eb] px-3 py-1 text-xs font-medium text-[#111217] hover:bg-white disabled:opacity-50">
            Submit for Review
          </button>
        )}
      </div>
      <div className="select-none text-[11px] text-[#6b6e77]">
        {stage.label} · ≈{stage.budgetMinutes}m · {current + 1}/{stages.length}
        <span className="ml-2 text-[#3c3f47]">←→ to move</span>
      </div>
    </div>
  );
}
```

```tsx
// src/features/problem-flow-v2/components/StageExplanationCard.tsx
'use client';

import { useEffect } from 'react';
import { useFlowStore } from '../store/store-context';
import type { Seniority } from '../types';

const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

/** First-entry-per-stage progressive disclosure; hosts the seniority picker on stage 1. */
export default function StageExplanationCard() {
  const stages = useFlowStore((s) => s.stages);
  const current = useFlowStore((s) => s.currentStage);
  const explanationSeen = useFlowStore((s) => s.explanationSeen);
  const dismissExplanation = useFlowStore((s) => s.dismissExplanation);
  const seniority = useFlowStore((s) => s.seniority);
  const setSeniority = useFlowStore((s) => s.setSeniority);

  const stage = stages[current];
  const open = !explanationSeen.includes(stage.id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismissExplanation(stage.id); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stage.id, dismissExplanation]);

  if (!open) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="pointer-events-auto w-[430px] rounded-2xl border border-white/10 bg-[#17181f] p-6 shadow-2xl shadow-black/50">
        <div className="mb-2 font-mono text-[10.5px] tracking-[.14em] text-[#8f95f2]">
          STEP {current + 1} OF {stages.length} · ≈{stage.budgetMinutes}M
        </div>
        <div className="mb-2 text-lg font-semibold tracking-tight text-[#e8e9eb]">{stage.label}</div>
        <div className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#b3b6bf]">{stage.explain}</div>

        {current === 0 && (
          <div className="mt-4 border-t border-white/[.07] pt-3.5">
            <div className="mb-2 text-xs text-[#8a8d96]">
              How deep should I calibrate suggestions? You can change this anytime.
            </div>
            <div className="flex gap-2">
              {SENIORITY_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setSeniority(o.value)}
                  className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${
                    seniority === o.value
                      ? 'border-[#8f95f2]/60 bg-[#8f95f2]/15 text-[#c3c6f7]'
                      : 'border-white/10 text-[#9a9da6] hover:border-white/25'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => dismissExplanation(stage.id)}
            className="rounded-lg bg-[#e8e9eb] px-4 py-2 text-[13px] font-medium text-[#111217] hover:bg-white">
            Got it — start sketching
          </button>
          <span className="text-[11px] text-[#5f636c]">esc</span>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/features/problem-flow-v2/components/GuideRail.tsx
'use client';

import { ChevronDown, RotateCw } from 'lucide-react';
import { useFlowStore } from '../store/store-context';
import type { Seniority } from '../types';

const NEXT_SENIORITY: Record<Seniority, Seniority> = { beginner: 'mid', mid: 'senior', senior: 'beginner' };
const SENIORITY_LABEL: Record<Seniority, string> = { beginner: 'Beginner', mid: 'Mid-level', senior: 'Senior' };

export default function GuideRail({ onReadCanvas }: { onReadCanvas(): void }) {
  const stages = useFlowStore((s) => s.stages);
  const current = useFlowStore((s) => s.currentStage);
  const statuses = useFlowStore((s) => s.stageStatuses);
  const railOpen = useFlowStore((s) => s.railOpen);
  const toggleRail = useFlowStore((s) => s.toggleRail);
  const goToStage = useFlowStore((s) => s.goToStage);
  const seniority = useFlowStore((s) => s.seniority);
  const setSeniority = useFlowStore((s) => s.setSeniority);
  const feedback = useFlowStore((s) => s.feedback);
  const setFeedback = useFlowStore((s) => s.setFeedback);
  const syncStatus = useFlowStore((s) => s.syncStatus);

  const stage = stages[current];

  if (!railOpen) {
    return (
      <button onClick={toggleRail}
        className="absolute right-5 top-[52px] z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-[#16171d] px-3 py-1.5 text-[11.5px] text-[#9a9da6] hover:border-white/20 hover:text-[#e8e9eb]">
        <span className="block h-1.5 w-1.5 rounded-full bg-[#8f95f2]" />
        Guide
      </button>
    );
  }

  return (
    <aside className="flex h-full w-[292px] flex-none flex-col border-l border-white/[.07] bg-[#121318]">
      <div className="border-b border-white/[.06] px-5 pb-3.5 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10.5px] tracking-[.14em] text-[#6b6e77]">GUIDE</span>
          <button onClick={toggleRail} title="Collapse" className="p-0.5 text-[#5f636c] hover:text-[#e8e9eb]">
            <ChevronDown size={13} />
          </button>
        </div>
        <div className="text-base font-semibold tracking-tight text-[#e8e9eb]">{stage.label}</div>
        <div className="mt-1 text-xs text-[#8a8d96]">
          step {current + 1} of {stages.length} · ideal ≈{stage.budgetMinutes}m
        </div>
        <div className="mt-3 flex gap-[3px]">
          {stages.map((s, i) => (
            <button key={s.id} title={s.label} onClick={() => goToStage(i)}
              className={`h-[3px] flex-1 rounded-sm transition-all duration-300 ${
                i === current ? 'bg-[#8f95f2]'
                : statuses[s.id] === 'passed' || statuses[s.id] === 'submitted' ? 'bg-[#8f95f2]/40'
                : 'bg-white/10'
              }`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-2.5 font-mono text-[10px] tracking-[.14em] text-[#6b6e77]">FOCUS ON</div>
        <div className="mb-5 flex flex-col gap-2">
          {stage.tipsBySeniority[seniority].map((tip) => (
            <div key={tip} className="flex gap-2 text-[12.5px] leading-relaxed text-[#b3b6bf]">
              <span className="flex-none text-[#4a4d56]">–</span><span>{tip}</span>
            </div>
          ))}
        </div>
        <div className="mb-2.5 font-mono text-[10px] tracking-[.14em] text-[#6b6e77]">WORTH CONSIDERING</div>
        <div className="mb-2.5 flex flex-col gap-2">
          {stage.suggestionsBySeniority[seniority].map((sug) => (
            <div key={sug} className="rounded-lg border border-dashed border-white/10 px-2.5 py-1.5 text-[12.5px] leading-normal text-[#8a8d96]">
              {sug}
            </div>
          ))}
        </div>
        <div className="text-[11px] leading-normal text-[#5f636c]">
          Reference only — the canvas is yours. Add, adapt or ignore.
        </div>
      </div>

      <div className="border-t border-white/[.06] px-5 pb-4 pt-3.5">
        {feedback.status === 'idle' && stage.sourceSteps.length > 0 && (
          <button onClick={onReadCanvas}
            className="w-full rounded-lg border border-white/10 py-2 text-[12.5px] text-[#9a9da6] transition-colors hover:border-[#8f95f2]/50 hover:text-[#e8e9eb]">
            Read my canvas
          </button>
        )}
        {feedback.status === 'loading' && (
          <div className="flex flex-col gap-1.5 py-1">
            <div className="h-2 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-0.5 text-[11px] text-[#5f636c]">reading your canvas…</div>
          </div>
        )}
        {feedback.status === 'done' && (
          <div className="flex flex-col gap-2">
            <div className="text-[11px] text-[#8a8d96]">
              score {feedback.result.score}/10{feedback.recorded ? ' · recorded' : ''}
            </div>
            {feedback.result.strengths.slice(0, 2).map((t) => (
              <div key={t} className="flex gap-2 text-xs leading-relaxed"><span className="flex-none text-emerald-400/80">✓</span><span className="text-[#b3b6bf]">{t}</span></div>
            ))}
            {feedback.result.weaknesses.slice(0, 2).map((t) => (
              <div key={t} className="flex gap-2 text-xs leading-relaxed"><span className="flex-none text-amber-400/80">→</span><span className="text-[#b3b6bf]">{t}</span></div>
            ))}
            {feedback.result.missed.slice(0, 2).map((t) => (
              <div key={t} className="flex gap-2 text-xs leading-relaxed"><span className="flex-none text-[#8f95f2]">?</span><span className="text-[#b3b6bf]">{t}</span></div>
            ))}
            <button onClick={() => setFeedback({ status: 'idle' })}
              className="self-start text-[11px] text-[#5f636c] hover:text-[#9a9da6]">dismiss</button>
          </div>
        )}
        {feedback.status === 'error' && (
          <div className="flex flex-col gap-1.5">
            <div className="text-xs leading-relaxed text-amber-300/90">{feedback.message}</div>
            <button onClick={() => setFeedback({ status: 'idle' })}
              className="self-start text-[11px] text-[#5f636c] hover:text-[#9a9da6]">dismiss</button>
          </div>
        )}
        <div className="mt-3.5 flex items-center justify-between">
          <button onClick={() => setSeniority(NEXT_SENIORITY[seniority])} title="Click to change"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[#9a9da6] hover:text-[#e8e9eb]">
            {SENIORITY_LABEL[seniority]} <RotateCw size={10} />
          </button>
          <span className="text-[10.5px] text-[#5f636c]">
            {syncStatus === 'synced' ? 'Saved to account' : syncStatus === 'syncing' ? 'saving…' : 'saved locally'}
          </span>
        </div>
      </div>
    </aside>
  );
}
```

```tsx
// src/features/problem-flow-v2/components/QuietTimer.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { togglePracticeTimer } from '@/app/actions/progress';

type Props = {
  problemId: string;
  startedAt: Date | string;
  isTimerRunning: boolean;
  totalPausedSeconds: number;
  lastPausedAt: Date | string | null;
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Corner timer: muted, monospace, click to pause. Counts up; never alarms. */
export default function QuietTimer(props: Props) {
  const [running, setRunning] = useState(props.isTimerRunning);
  const [pausedSeconds, setPausedSeconds] = useState(props.totalPausedSeconds);
  const [lastPausedAt, setLastPausedAt] = useState(props.lastPausedAt);
  const [, setTick] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const started = new Date(props.startedAt).getTime();
  const frozenAt = !running && lastPausedAt ? new Date(lastPausedAt).getTime() : Date.now();
  const elapsed = Math.max(0, Math.floor((frozenAt - started) / 1000) - pausedSeconds);

  const toggle = () => startTransition(async () => {
    const res = await togglePracticeTimer(props.problemId);
    if (res.success) {
      setRunning(!!res.isTimerRunning);
      setPausedSeconds(res.totalPausedSeconds ?? pausedSeconds);
      setLastPausedAt(res.lastPausedAt ?? null);
    }
  });

  return (
    <button onClick={toggle} disabled={isPending} title={running ? 'Click to pause' : 'Paused — click to resume'}
      className={`absolute right-5 top-3.5 z-20 rounded-lg border border-white/[.07] bg-[#16171d]/90 px-3 py-1.5 font-mono text-xs ${
        running ? 'text-[#6b6e77]' : 'text-[#8f95f2]'
      } hover:text-[#c9ccd4]`}>
      {formatElapsed(elapsed)}{!running && ' ⏸'}
    </button>
  );
}
```

```tsx
// src/features/problem-flow-v2/components/Breadcrumb.tsx
'use client';

import Link from 'next/link';
import { useFlowStore } from '../store/store-context';

export default function Breadcrumb({ problemTitle }: { problemTitle: string }) {
  const stages = useFlowStore((s) => s.stages);
  const current = useFlowStore((s) => s.currentStage);
  return (
    <div className="absolute left-5 top-3.5 z-20 flex max-w-[45%] items-center gap-2.5 truncate rounded-lg border border-white/[.07] bg-[#16171d]/90 px-3.5 py-1.5 text-[12.5px] text-[#8a8d96]">
      <Link href="/problems" className="flex-none text-[#5f636c] hover:text-[#e8e9eb]">←</Link>
      <span className="flex-none">{problemTitle}</span>
      <span className="flex-none text-[#3c3f47]">/</span>
      <span className="truncate text-[#c9ccd4]">{stages[current].label}</span>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/features/problem-flow-v2/__tests__/stage-dock.test.tsx`
Expected: PASS (4 tests). Then `pnpm tsc --noEmit` — no new errors. Note: if `togglePracticeTimer` isn't re-exported from `@/app/actions/progress`, match the import path `TimerWidget.tsx` uses.

- [ ] **Step 6: Commit**

```bash
git add src/features/problem-flow-v2
git commit -m "feat(flow-v2): guide rail, stage dock, explanation card, quiet timer, breadcrumb"
```

---

### Task 11: Root component — `ProblemFlowV2` (session lifecycle, sync, completion)

**Files:**
- Create: `src/features/problem-flow-v2/ProblemFlowV2.tsx`
- Create: `src/features/problem-flow-v2/components/CompletionCard.tsx`
- Test: `src/features/problem-flow-v2/__tests__/problem-flow-v2.test.tsx` (smoke: renders chrome with mocked canvas)

**Interfaces:**
- Consumes: all prior tasks; `startPracticeSession`, `completeSession` from `@/app/actions/progress`; `syncFlowV2Session` from `@/app/actions/progress/flow-v2`; `exportSceneToPng`, `blobToDataUrl`, `trimSceneForDbSnapshot` from `@/lib/diagram-persistence`; `buildStageJourney`.
- Produces (the page-seam contract for Task 12):
  ```typescript
  type ProblemFlowV2Props = {
    problem: SystemDesignProblem;                 // with .steps resolved
    phaseSteps: Record<string, StepData[]>;      // getPracticeSteps().steps
    initialSession: {
      sessionId: string | null;
      startedAt: Date | string | null;
      isTimerRunning: boolean;
      totalPausedSeconds: number;
      lastPausedAt: Date | string | null;
      canvasState: unknown | null;               // PracticeSession.canvasState
      flowState: unknown | null;                 // PracticeSession.flowState
    } | null;
  };
  export default function ProblemFlowV2(props: ProblemFlowV2Props): JSX.Element;
  ```

- [ ] **Step 1: Implement CompletionCard**

```tsx
// src/features/problem-flow-v2/components/CompletionCard.tsx
'use client';

import Link from 'next/link';

export default function CompletionCard({ score }: { score: number | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="pointer-events-auto w-[430px] rounded-2xl border border-white/10 bg-[#17181f] p-6 text-center shadow-2xl">
        <div className="mb-2 font-mono text-[10.5px] tracking-[.14em] text-[#8f95f2]">SESSION COMPLETE</div>
        <div className="mb-1 text-lg font-semibold text-[#e8e9eb]">Nice work.</div>
        {score !== null && <div className="mb-4 text-sm text-[#8a8d96]">Average step score: {score}/10</div>}
        <div className="flex justify-center gap-3">
          <Link href="/problems" className="rounded-lg bg-[#e8e9eb] px-4 py-2 text-[13px] font-medium text-[#111217] hover:bg-white">
            Back to problems
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement ProblemFlowV2**

```tsx
// src/features/problem-flow-v2/ProblemFlowV2.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { StepData, SystemDesignProblem } from '@/types';
import type { ExcalidrawScene } from '@/types/diagram';
import { startPracticeSession, completeSession } from '@/app/actions/progress';
import { syncFlowV2Session } from '@/app/actions/progress/flow-v2';
import { blobToDataUrl, exportSceneToPng, trimSceneForDbSnapshot } from '@/lib/diagram-persistence';
import { buildStageJourney } from './lib/stage-journey';
import { createFlowStore, type FlowStore } from './store/flow-store';
import { FlowStoreProvider, useFlowStore } from './store/store-context';
import { useStageFeedback } from './lib/use-stage-feedback';
import type { FlowStateV2 } from './types';
import CanvasStage from './components/CanvasStage';
import GuideRail from './components/GuideRail';
import StageDock from './components/StageDock';
import StageExplanationCard from './components/StageExplanationCard';
import QuietTimer from './components/QuietTimer';
import Breadcrumb from './components/Breadcrumb';
import CompletionCard from './components/CompletionCard';

const IDLE_SYNC_MS = 30_000;
const FLOW_LS_KEY = (problemId: string) => `flow-v2-${problemId}`;

export type ProblemFlowV2Props = {
  problem: SystemDesignProblem;
  phaseSteps: Record<string, StepData[]>;
  initialSession: {
    sessionId: string | null;
    startedAt: Date | string | null;
    isTimerRunning: boolean;
    totalPausedSeconds: number;
    lastPausedAt: Date | string | null;
    canvasState: unknown | null;
    flowState: unknown | null;
  } | null;
};

function isFlowStateV2(v: unknown): v is FlowStateV2 {
  return !!v && typeof v === 'object' && (v as FlowStateV2).version === 2;
}

/** Prefer whichever flow state (DB vs localStorage) was written last. */
function resolveInitialFlowState(problemId: string, dbState: unknown): FlowStateV2 | null {
  let local: FlowStateV2 | null = null;
  try {
    const raw = localStorage.getItem(FLOW_LS_KEY(problemId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isFlowStateV2(parsed)) local = parsed;
    }
  } catch { /* corrupt local state: ignore */ }
  const db = isFlowStateV2(dbState) ? dbState : null;
  if (local && db) return Date.parse(db.updatedAt) > Date.parse(local.updatedAt) ? db : local;
  return db ?? local;
}

export default function ProblemFlowV2({ problem, phaseSteps, initialSession }: ProblemFlowV2Props) {
  const stages = useMemo(() => buildStageJourney(phaseSteps, problem), [phaseSteps, problem]);
  const [store] = useState<FlowStore>(() =>
    createFlowStore({
      problemId: problem.id,
      stages,
      initialFlowState: typeof window === 'undefined'
        ? null
        : resolveInitialFlowState(problem.id, initialSession?.flowState ?? null),
    }),
  );

  return (
    <FlowStoreProvider store={store}>
      <FlowSession problem={problem} initialSession={initialSession} />
    </FlowStoreProvider>
  );
}

function FlowSession({ problem, initialSession }: Omit<ProblemFlowV2Props, 'phaseSteps'>) {
  const store = useFlowStoreApi();
  const stages = useFlowStore((s) => s.stages);
  const currentStage = useFlowStore((s) => s.currentStage);
  const sessionId = useFlowStore((s) => s.sessionId);

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const latestSceneRef = useRef<ExcalidrawScene | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // 1. Ensure a PracticeSession exists (mirrors old-flow startPracticeSession usage).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initialSession?.sessionId) { store.getState().setSessionId(initialSession.sessionId); return; }
      const res = await startPracticeSession(problem.id);
      if (!cancelled && res.success && res.sessionId) store.getState().setSessionId(res.sessionId);
    })();
    return () => { cancelled = true; };
  }, [problem.id, initialSession?.sessionId, store]);

  // 2. Persist flow state to localStorage on every store change; schedule idle DB sync.
  const syncToServer = useCallback(async () => {
    const s = store.getState();
    if (!s.sessionId) return;
    s.setSyncStatus('syncing');
    const res = await syncFlowV2Session({
      sessionId: s.sessionId,
      canvasState: latestSceneRef.current
        ? { scene: trimSceneForDbSnapshot(latestSceneRef.current), timestamp: new Date().toISOString() }
        : undefined,
      flowState: s.toFlowState(),
    });
    s.setSyncStatus(res.success ? 'synced' : 'error');
  }, [store]);

  useEffect(() => {
    const unsub = store.subscribe((s, prev) => {
      // Persist flow metadata locally on any meaningful change.
      if (s.currentStage !== prev.currentStage || s.stageStatuses !== prev.stageStatuses ||
          s.seniority !== prev.seniority || s.explanationSeen !== prev.explanationSeen) {
        try { localStorage.setItem(FLOW_LS_KEY(s.problemId), JSON.stringify(s.toFlowState())); } catch { /* quota */ }
      }
      // Stage transition → immediate server sync.
      if (s.currentStage !== prev.currentStage) void syncToServer();
    });
    return unsub;
  }, [store, syncToServer]);

  const scheduleIdleSync = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => void syncToServer(), IDLE_SYNC_MS);
  }, [syncToServer]);

  const handleSceneChange = useCallback((scene: ExcalidrawScene) => {
    latestSceneRef.current = scene;
    store.getState().setSyncStatus('local');
    scheduleIdleSync();
  }, [scheduleIdleSync, store]);

  useEffect(() => () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }, []);

  // 3. Feedback pipeline.
  const getElements = useCallback(
    () => apiRef.current?.getSceneElements() ?? latestSceneRef.current?.elements ?? [],
    [],
  );
  const { submitForReview, readMyCanvas } = useStageFeedback({ store, problem, getElements });

  // Submit also syncs, and on the last stage offers completion.
  const handleSubmit = useCallback(async () => {
    await submitForReview();
    void syncToServer();
  }, [submitForReview, syncToServer]);

  // 4. Completion: last stage + explicit finish.
  const handleFinish = useCallback(async () => {
    const s = store.getState();
    if (!s.sessionId) return;
    const scores = Object.entries(s.stageStatuses)
      .filter(([, status]) => status === 'passed' || status === 'submitted').length;
    // finalScore: average of recorded StepSubmission scores is the source of truth
    // server-side; client sends a simple completion-percent proxy like the old flow.
    const score = Math.round((scores / s.stages.length) * 10);
    let snapshot: unknown;
    const scene = latestSceneRef.current;
    if (scene) {
      const png = await exportSceneToPng(scene).catch(() => null);
      snapshot = {
        scene: trimSceneForDbSnapshot(scene),
        imageData: png ? await blobToDataUrl(png) : undefined,
        timestamp: new Date().toISOString(),
      };
    }
    const res = await completeSession(s.sessionId, score, snapshot);
    if (res.success) { setFinalScore(score); setCompleted(true); }
  }, [store]);

  const isLastStage = currentStage === stages.length - 1;

  return (
    <div className="fixed inset-0 flex flex-row overflow-hidden bg-[#0e0f12] text-[#e8e9eb]">
      <div className="relative min-w-0 flex-1">
        <CanvasStage
          problemId={problem.id}
          problem={problem}
          stages={stages}
          currentStageIndex={currentStage}
          initialCanvasState={(initialSession?.canvasState as { scene: ExcalidrawScene; timestamp?: string } | null) ?? null}
          onApiReady={(api) => { apiRef.current = api; }}
          onSceneChange={handleSceneChange}
        />
        <Breadcrumb problemTitle={problem.title} />
        {initialSession?.startedAt && sessionId && (
          <QuietTimer
            problemId={problem.id}
            startedAt={initialSession.startedAt}
            isTimerRunning={initialSession.isTimerRunning}
            totalPausedSeconds={initialSession.totalPausedSeconds}
            lastPausedAt={initialSession.lastPausedAt}
          />
        )}
        <StageDock onSubmit={handleSubmit} />
        {isLastStage && !completed && (
          <button onClick={handleFinish}
            className="absolute bottom-4 right-5 z-20 rounded-lg border border-[#8f95f2]/40 bg-[#8f95f2]/10 px-3.5 py-2 text-xs text-[#c3c6f7] hover:bg-[#8f95f2]/20">
            Finish session
          </button>
        )}
        <StageExplanationCard />
        {completed && <CompletionCard score={finalScore} />}
      </div>
      <GuideRail onReadCanvas={readMyCanvas} />
    </div>
  );
}
```

Use `useFlowStoreApi()` from Task 10's store-context to get the store handle inside `FlowSession` (add it to the imports from `./store/store-context`). Wrap `CanvasStage` usage with the existing `ErrorBoundary` from `@/components/ErrorBoundary` (check its export shape and follow how `PracticeUI.tsx` uses it).

- [ ] **Step 3: Write the smoke test**

```tsx
// src/features/problem-flow-v2/__tests__/problem-flow-v2.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../components/CanvasStage', () => ({
  default: () => <div data-testid="mock-canvas" />,
}));
vi.mock('@/app/actions/progress', () => ({
  startPracticeSession: vi.fn().mockResolvedValue({ success: true, sessionId: 's1' }),
  completeSession: vi.fn(),
  togglePracticeTimer: vi.fn(),
  recordStepSubmission: vi.fn(),
}));
vi.mock('@/app/actions/progress/flow-v2', () => ({
  syncFlowV2Session: vi.fn().mockResolvedValue({ success: true }),
}));

import ProblemFlowV2 from '../ProblemFlowV2';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: 'p1', title: 'Design YouTube', slug: 'design-youtube', context: 'A video platform.',
  functionalRequirements: [], nonFunctionalRequirements: [],
  difficulty: 'Hard', category: 'x', companies: [],
};

describe('ProblemFlowV2', () => {
  it('renders canvas, rail, dock and the first explanation card', () => {
    render(<ProblemFlowV2 problem={problem} phaseSteps={DEFAULT_PHASE_STEPS} initialSession={null} />);
    expect(screen.getByTestId('mock-canvas')).toBeTruthy();
    expect(screen.getByText('GUIDE')).toBeTruthy();
    expect(screen.getByText(/STEP 1 OF/)).toBeTruthy();
    expect(screen.getByText('Got it — start sketching')).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/features/problem-flow-v2` then `pnpm tsc --noEmit`
Expected: all feature tests PASS; no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/problem-flow-v2
git commit -m "feat(flow-v2): session root — lifecycle, sync, feedback wiring, completion"
```

---

### Task 12: Page seam — flag branch in `practice/[slug]/page.tsx`

**Files:**
- Modify: `src/app/practice/[slug]/page.tsx`

**Interfaces:**
- Consumes: `canAccessFeature(userId, 'newProblemFlow')`; `ProblemFlowV2` props contract from Task 11; `existingProgress.activeSession` (now includes `canvasState`/`flowState` columns automatically).

- [ ] **Step 1: Add the branch**

In `src/app/practice/[slug]/page.tsx`:

Add import:
```typescript
import ProblemFlowV2 from '@/features/problem-flow-v2/ProblemFlowV2';
```

After the existing feature resolutions (line ~66), add:
```typescript
  const newFlowEnabled = await canAccessFeature(session.user.id, 'newProblemFlow');
```

Immediately before the final `return (<PracticeUI .../>)`, add:
```typescript
  // Flow V2: canvas-first guided flow. Interview mode is deferred in v2 —
  // an explicit ?interview= request keeps the old flow so the feature stays usable.
  if (newFlowEnabled && !interviewConfig) {
    const active = existingProgress?.activeSession;
    return (
      <ProblemFlowV2
        problem={problem}
        phaseSteps={steps}
        initialSession={
          active && active.status === 'ACTIVE'
            ? {
                sessionId: active.id,
                startedAt: active.startedAt,
                isTimerRunning: active.isTimerRunning,
                totalPausedSeconds: active.totalPausedSeconds,
                lastPausedAt: active.lastPausedAt,
                canvasState: active.canvasState ?? null,
                flowState: active.flowState ?? null,
              }
            : null
        }
      />
    );
  }
```

The old `return (<PracticeUI .../>)` stays untouched — flag off (or interview mode) is byte-identical behavior.

- [ ] **Step 2: Verify types + full test suite**

Run: `pnpm tsc --noEmit && pnpm vitest run`
Expected: clean types; full suite PASS (nothing outside the seam changed).

- [ ] **Step 3: Commit**

```bash
git add src/app/practice/[slug]/page.tsx
git commit -m "feat(flow-v2): route practice sessions to Flow V2 behind newProblemFlow flag"
```

---

### Task 13: End-to-end verification (both flag states)

**Files:**
- None created — verification task. Use the `ultimate-sd:verify` project skill to launch and drive the app.

- [ ] **Step 1: Seed the flag dark and verify the old flow is unchanged**

Run: `pnpm seed:flags`
Then launch the app (per `ultimate-sd:verify` skill), open `/practice/design-tinyurl` as a test user, and confirm the OLD flow renders (left sidebar, StepByStepChat) and works: answer a step, submit, see feedback.

- [ ] **Step 2: Enable the flag for the test user and verify the new flow**

In the admin panel (`/admin` → Feature Flags), set a per-user override for `newProblemFlow` → enabled for your test user (or enable for all plans in dev). Reload `/practice/design-tinyurl` and verify:
- Full-bleed dark canvas renders with the problem card seeded and locked.
- Explanation card shows for stage 1 with the seniority picker; `esc` and the button dismiss it.
- Drawing a shape, then navigating stages (dock buttons, ticks, `←`/`→`) pans the camera and seeds section headers; elements stay on one canvas.
- Guide rail collapses to the "Guide" chip and back; tips change when seniority chip is cycled.
- "Submit for Review" on FR stage returns AI feedback in the rail and records a submission (check `StepSubmission` rows or profile history).
- "Read my canvas" returns notes without recording.
- Refresh mid-session → canvas and stage position restore (localStorage). Check `PracticeSession.canvasState`/`flowState` populated after a stage transition (DB sync).
- Timer shows top-right, click pauses/resumes.
- "Finish session" on the last stage completes: `PracticeSession.status = COMPLETED`, `diagramSnapshot` saved, CompletionCard shown.

- [ ] **Step 3: Flip the flag off and confirm reversal**

Disable the override; reload — old flow returns, old localStorage drafts intact.

- [ ] **Step 4: Record findings**

Fix anything broken (small fixes inline in this task; anything structural becomes a follow-up task). Then run the full gate: `pnpm tsc --noEmit && pnpm vitest run && pnpm lint`.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix(flow-v2): e2e verification fixes"
```

---

## Deferred / follow-ups (do NOT build now)

- Interview Mode / Voice / Practice Aloud / AI Probe / Export PDF / Help Assistant / tour parity in Flow V2.
- Excalidraw SD stencil library; embedded-image persistence.
- Camera animation easing (v1 jumps directly via `updateScene`; smooth lerp is a polish follow-up).
- E2E Playwright spec for the new flow (add once the UI stabilizes).
```
