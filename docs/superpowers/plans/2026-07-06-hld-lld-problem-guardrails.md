# HLD/LLD Problem-Content Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Structurally guarantee every practice problem in `ultimate-sd` has all 5 canonical phases (Requirements, HLD, LLD, Tradeoffs, Scalability) and a real, non-empty problem statement — enforced by a validator, not author diligence — without yet writing bespoke per-problem content (that's separate follow-on work, phases A/B/C from the design spec).

**Architecture:** Replace the current full-replacement step resolution (`problem.steps || DEFAULT_PHASE_STEPS`) with a per-phase merge that backfills any phase a custom problem doesn't define from a generic template — selecting an OOD-flavored generic template for problems tagged `oop-design`. Replace the single-sentence `description`/buzzword `requirements` fields with structured `context`/`functionalRequirements`/`nonFunctionalRequirements` fields via a one-off codemod. Add a zod-backed validator that checks both the resolved step set (structural) and the new content fields (richness).

**Tech Stack:** TypeScript, zod (already a dependency), vitest (existing test runner), tsx (existing script runner), pnpm.

**Reference:** `docs/superpowers/specs/2026-07-06-hld-lld-problem-quality-design.md`

## Global Constraints

- Package manager is **pnpm**, not npm — every command in this plan uses `pnpm`/`pnpm exec`.
- **Deviation from the design spec:** `StepData.phase` stays a free-form `string`, not a `'Requirements' | 'HLD' | 'LLD' | 'Tradeoffs' | 'Scalability'` union. `src/lib/problem-steps.ts` has dozens of custom phase labels (`'Algorithm'`, `'Database'`, `'Scale & Constraints'`, etc.) beyond the 5 canonical ones — constraining the type would break existing custom content. HLD/LLD detection continues to use the existing key/label heuristics already in `src/lib/step-journey.ts` (`resolveEvaluationPhaseKey`, `HLD_PHASE_KEYS`/`LLD_PHASE_KEYS`).
- The `oop-design` tag lives in `PROBLEM_TAG_IDS` (`src/lib/problem-tags.ts`), keyed by slug — **not** on `SystemDesignProblem.tags` (that's a separate legacy free-text field). Any OOD detection must key off `PROBLEM_TAG_IDS[slug]`, not `problem.tags`.
- This plan covers the **structural guardrails only** (Task 1–3 below). Writing bespoke HLD/LLD/context content for the 86 problems (design spec's Phase A/B/C) is out of scope here and should be planned separately once this lands.

---

### Task 1: Backfill/merge step resolution with an OOD-aware generic template

**Files:**
- Modify: `ultimate-sd/src/lib/steps.ts` (add `GENERIC_OOD_PHASE_STEPS`)
- Modify: `ultimate-sd/src/lib/step-journey.ts` (merge logic + `getGenericFallbackSteps`)
- Modify: `ultimate-sd/src/components/PracticeUI.tsx:28,105,165`
- Modify: `ultimate-sd/src/components/StepByStepChat.tsx:59,251,281,323,325`
- Test: `ultimate-sd/src/lib/__tests__/step-journey.test.ts`

**Interfaces:**
- Produces: `GENERIC_OOD_PHASE_STEPS: { [key: string]: StepData[] }` (export from `src/lib/steps.ts`), `getGenericFallbackSteps(problem: SystemDesignProblem): Record<string, StepData[]>` (export from `src/lib/step-journey.ts`).
- Modifies behavior of: `resolvePhaseSteps(steps, fallback)` (existing export from `src/lib/step-journey.ts`) — same signature, now merges instead of full-replacing.

- [ ] **Step 1: Write failing tests for the merge behavior**

Add to `ultimate-sd/src/lib/__tests__/step-journey.test.ts` (add this new `import` line alongside the existing ones at the top, and the two new `describe` blocks at the end of the file):

```ts
import { GENERIC_OOD_PHASE_STEPS } from '../steps';
import { getGenericFallbackSteps } from '../step-journey';
import type { SystemDesignProblem } from '@/types';
```

```ts
describe('resolvePhaseSteps backfill merge', () => {
  it('keeps custom phases and backfills missing ones from the generic fallback', () => {
    const custom = {
      requirements: DEFAULT_PHASE_STEPS.requirements,
      algorithm: [
        {
          phase: 'Algorithm',
          subStep: 'encoding',
          title: 'Encoding',
          prompt: 'Explain your encoding scheme.',
          inputType: 'textarea' as const,
        },
      ],
    };
    const merged = resolvePhaseSteps(custom, DEFAULT_PHASE_STEPS);

    expect(Object.keys(merged)).toEqual(
      expect.arrayContaining(['requirements', 'algorithm', 'hld', 'lld', 'tradeoffs', 'scalability'])
    );
    expect(merged.hld).toBe(DEFAULT_PHASE_STEPS.hld);
    expect(merged.lld).toBe(DEFAULT_PHASE_STEPS.lld);
    expect(merged.algorithm).toBe(custom.algorithm);
  });

  it('falls back entirely to the generic template when no custom steps exist', () => {
    expect(resolvePhaseSteps(undefined, DEFAULT_PHASE_STEPS)).toEqual(DEFAULT_PHASE_STEPS);
  });
});

describe('getGenericFallbackSteps', () => {
  it('selects the OOD generic template for oop-design tagged problems', () => {
    const problem = { slug: 'design-parking-lot' } as SystemDesignProblem;
    expect(getGenericFallbackSteps(problem)).toBe(GENERIC_OOD_PHASE_STEPS);
  });

  it('selects the default generic template for everything else', () => {
    const problem = { slug: 'design-tinyurl' } as SystemDesignProblem;
    expect(getGenericFallbackSteps(problem)).toBe(DEFAULT_PHASE_STEPS);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd ultimate-sd && pnpm exec vitest run src/lib/__tests__/step-journey.test.ts`
Expected: FAIL — `getGenericFallbackSteps` and `GENERIC_OOD_PHASE_STEPS` are not defined/exported yet, and the "backfills missing ones" assertion fails because `resolvePhaseSteps` currently does `steps ?? fallback` (full replace, so `merged.hld`/`merged.lld` are `undefined`).

- [ ] **Step 3: Add `GENERIC_OOD_PHASE_STEPS` to `src/lib/steps.ts`**

Append to `ultimate-sd/src/lib/steps.ts` (after the closing `};` of `DEFAULT_PHASE_STEPS`):

```ts

/** Generic HLD/LLD backfill for OOD/class-design problems (e.g. parking lot, elevator system). */
export const GENERIC_OOD_PHASE_STEPS: { [key: string]: StepData[] } = {
    requirements: [
        {
            phase: 'Requirements',
            subStep: 'functional',
            title: 'Functional Requirements',
            prompt: 'What operations must your objects/classes support? List the key use-cases a client of your system will invoke.',
            inputType: 'list',
            placeholder: 'e.g., Vehicle can enter and exit a parking spot'
        },
        {
            phase: 'Requirements',
            subStep: 'non-functional',
            title: 'Non-Functional Requirements',
            prompt: 'What quality attributes matter? Consider thread-safety, extensibility, and multi-instance scaling.',
            inputType: 'list',
            placeholder: 'e.g., Support concurrent access from 50 entry gates'
        },
        {
            phase: 'Requirements',
            subStep: 'constraints',
            title: 'Constraints & Assumptions',
            prompt: 'What are the constraints and assumptions? Consider the physical/business rules your objects must respect.',
            inputType: 'list',
            placeholder: 'e.g., Each spot fits exactly one vehicle of its size class'
        }
    ],
    hld: [
        {
            phase: 'HLD',
            subStep: 'class-design',
            title: 'Class & Interface Design',
            prompt: 'Identify the core classes and interfaces in your design. What is each one responsible for?',
            inputType: 'list',
            placeholder: 'e.g., ParkingSpot, Ticket, PaymentProcessor'
        },
        {
            phase: 'HLD',
            subStep: 'architecture',
            title: 'Component Interaction',
            prompt: 'How do your classes collaborate to fulfill a use-case end to end? Describe the object graph and key relationships (composition vs inheritance).',
            inputType: 'textarea',
            placeholder: 'Walk through a use-case across your classes...'
        }
    ],
    lld: [
        {
            phase: 'LLD',
            subStep: 'state-machine',
            title: 'State & Behavior',
            prompt: 'Model the internal state transitions for your core entity. What states can it be in, and what triggers a transition?',
            inputType: 'textarea',
            placeholder: 'e.g., SPOT: FREE -> RESERVED -> OCCUPIED -> FREE'
        },
        {
            phase: 'LLD',
            subStep: 'concurrency',
            title: 'Concurrency & Edge Cases',
            prompt: 'How do you handle concurrent access and edge cases (e.g., two threads claiming the same resource)? What locking or synchronization is needed?',
            inputType: 'textarea',
            placeholder: 'Explain your locking/synchronization strategy...'
        }
    ],
    tradeoffs: [
        {
            phase: 'Trade-offs',
            subStep: 'decisions',
            title: 'Key Decisions & Trade-offs',
            prompt: 'What major design decisions did you make (e.g., composition over inheritance, interface segregation)? What alternatives did you consider?',
            inputType: 'list',
            placeholder: 'e.g., Chose composition over inheritance for VehicleType'
        },
        {
            phase: 'Trade-offs',
            subStep: 'bottlenecks',
            title: 'Extensibility & Bottlenecks',
            prompt: 'How would you extend this design for a new requirement without modifying existing classes (Open/Closed Principle)? What would become a bottleneck at scale?',
            inputType: 'list',
            placeholder: 'e.g., Adding a new vehicle type requires no changes to ParkingLot'
        }
    ],
    scalability: [
        {
            phase: 'Scalability',
            subStep: 'scaling',
            title: 'Scaling Strategy',
            prompt: 'How would this design scale across multiple instances/locations (e.g., multiple parking garages)? What state needs to be shared vs local?',
            inputType: 'textarea',
            placeholder: 'Explain how state is partitioned across instances...'
        },
        {
            phase: 'Scalability',
            subStep: 'monitoring',
            title: 'Monitoring & Reliability',
            prompt: 'How would you monitor and ensure reliability of the system? What metrics and failure modes matter?',
            inputType: 'list',
            placeholder: 'e.g., Monitor spot-occupancy drift, gate failure rate'
        }
    ]
};
```

- [ ] **Step 4: Update `resolvePhaseSteps` to merge, and add `getGenericFallbackSteps`, in `src/lib/step-journey.ts`**

Change the import line at the top of `ultimate-sd/src/lib/step-journey.ts`:

```ts
import { StepData } from '@/types';
```

to:

```ts
import { StepData, SystemDesignProblem } from '@/types';
import { DEFAULT_PHASE_STEPS, GENERIC_OOD_PHASE_STEPS } from './steps';
import { PROBLEM_TAG_IDS } from './problem-tags';
```

Replace the existing `resolvePhaseSteps` function:

```ts
export function resolvePhaseSteps(
  steps: Record<string, StepData[]> | undefined,
  fallback: Record<string, StepData[]>
): Record<string, StepData[]> {
  return steps ?? fallback;
}
```

with:

```ts
export function resolvePhaseSteps(
  steps: Record<string, StepData[]> | undefined,
  fallback: Record<string, StepData[]>
): Record<string, StepData[]> {
  return steps ? { ...fallback, ...steps } : fallback;
}

/** Picks the OOD-flavored generic template for oop-design tagged problems, else the default. */
export function getGenericFallbackSteps(problem: SystemDesignProblem): Record<string, StepData[]> {
  const tagIds = PROBLEM_TAG_IDS[problem.slug];
  return tagIds?.includes('oop-design') ? GENERIC_OOD_PHASE_STEPS : DEFAULT_PHASE_STEPS;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd ultimate-sd && pnpm exec vitest run src/lib/__tests__/step-journey.test.ts`
Expected: PASS (all tests including the pre-existing `describe('problem journey audit', ...)` block).

- [ ] **Step 6: Update `PracticeUI.tsx` call sites**

In `ultimate-sd/src/components/PracticeUI.tsx`, change the import on line 29 from:

```ts
import { getDiagramStepKeysForProblem, isDiagramSubStep, resolvePhaseSteps } from '@/lib/step-journey';
```

to:

```ts
import { getDiagramStepKeysForProblem, getGenericFallbackSteps, isDiagramSubStep, resolvePhaseSteps } from '@/lib/step-journey';
```

Remove the now-unused import on line 28:

```ts
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
```

Change line 105 from:

```ts
  const activeSteps = problem.steps || DEFAULT_PHASE_STEPS;
```

to:

```ts
  const activeSteps = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem));
```

Change line 165 from:

```ts
  const phaseSteps = resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS);
```

to:

```ts
  const phaseSteps = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem));
```

- [ ] **Step 7: Update `StepByStepChat.tsx` call sites**

In `ultimate-sd/src/components/StepByStepChat.tsx`, change the import block starting at line 60 from:

```ts
import {
  buildStepKey,
  clampStepIndex,
  getDiagramStepKeysForProblem,
  isDiagramSubStep,
  isFirstJourneyStep,
  resolveEffectivePhase,
  resolvePhaseSteps,
} from '@/lib/step-journey';
```

to:

```ts
import {
  buildStepKey,
  clampStepIndex,
  getDiagramStepKeysForProblem,
  getGenericFallbackSteps,
  isDiagramSubStep,
  isFirstJourneyStep,
  resolveEffectivePhase,
  resolvePhaseSteps,
} from '@/lib/step-journey';
```

Remove the now-unused import on line 59:

```ts
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
```

Replace each of the 4 remaining usages of `DEFAULT_PHASE_STEPS` with `getGenericFallbackSteps(problem)`:

Line 251, from:
```ts
    const keys = Object.keys(resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS));
```
to:
```ts
    const keys = Object.keys(resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem)));
```

Line 281, from:
```ts
  const PHASE_STEPS = resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS);
```
to:
```ts
  const PHASE_STEPS = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem));
```

Lines 323 and 325, from:
```ts
    const phaseKeys = Object.keys(resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS));
    const nextPhase = resolveEffectivePhase(currentPhase, phaseKeys);
    const stepsInPhase = resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS)[nextPhase] ?? [];
```
to:
```ts
    const phaseKeys = Object.keys(resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem)));
    const nextPhase = resolveEffectivePhase(currentPhase, phaseKeys);
    const stepsInPhase = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem))[nextPhase] ?? [];
```

- [ ] **Step 8: Run the full unit test suite**

Run: `cd ultimate-sd && pnpm test -- run`
Expected: PASS, no regressions.

- [ ] **Step 9: Commit**

```bash
cd ultimate-sd && git add src/lib/steps.ts src/lib/step-journey.ts src/components/PracticeUI.tsx src/components/StepByStepChat.tsx src/lib/__tests__/step-journey.test.ts
git commit -m "fix: backfill missing HLD/LLD phases instead of replacing custom steps wholesale"
```

---

### Task 2: Structured problem-statement fields (`context`/`functionalRequirements`/`nonFunctionalRequirements`)

**Files:**
- Modify: `ultimate-sd/src/types/index.ts:11-22`
- Create (temporary, deleted at end of task): `ultimate-sd/scripts/migrate-problem-fields.ts`
- Modify: `ultimate-sd/src/lib/problems.ts` (via the migration script, plus one manual fix in `getProblemBySlug`)
- Modify: `ultimate-sd/src/lib/help-langgraph.ts:81,84`
- Modify: `ultimate-sd/src/lib/langgraph.ts:122`
- Modify: `ultimate-sd/src/app/api/ai/evaluate/route.ts:278`
- Modify: `ultimate-sd/src/app/practice/[slug]/page.tsx:28`
- Modify: `ultimate-sd/src/components/ProblemCard.tsx:88`
- Modify: `ultimate-sd/src/components/ChatInterface.tsx:132`

**Interfaces:**
- Produces: `SystemDesignProblem.context: string`, `SystemDesignProblem.functionalRequirements: string[]`, `SystemDesignProblem.nonFunctionalRequirements: string[]` (replacing `description`/`requirements`) — consumed by Task 3's validator.

- [ ] **Step 1: Update the `SystemDesignProblem` type**

In `ultimate-sd/src/types/index.ts`, replace lines 11-22:

```ts
export interface SystemDesignProblem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  companies: string[];
  tags?: string[];
  requirements: string[];
  steps?: Record<string, StepData[]>;
}
```

with:

```ts
export interface SystemDesignProblem {
  id: string;
  title: string;
  slug: string;
  context: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  companies: string[];
  tags?: string[];
  steps?: Record<string, StepData[]>;
}
```

- [ ] **Step 2: Confirm the build now fails**

Run: `cd ultimate-sd && pnpm exec tsc --noEmit`
Expected: FAIL, with errors in `src/lib/problems.ts` (`description`/`requirements` don't exist on `SystemDesignProblem`) and in the 6 files listed above under Files (`.description`/`.requirements` no longer resolve). This is the expected/intended failure state before the migration script runs.

- [ ] **Step 3: Write the one-off migration script**

Create `ultimate-sd/scripts/migrate-problem-fields.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const filePath = join(process.cwd(), 'src/lib/problems.ts');
const original = readFileSync(filePath, 'utf8');

const withContext = original.replace(
  /(\s*)description(:\s*'[^']*',)/g,
  '$1context$2'
);

const migrated = withContext.replace(
  /(\s*)requirements:\s*(\[[^\]]*\]),?/g,
  (_match, indent: string, arr: string) =>
    `${indent}functionalRequirements: ${arr},${indent}nonFunctionalRequirements: [],`
);

if (migrated === original) {
  throw new Error('Migration made no changes — check the regexes against the current file contents.');
}

writeFileSync(filePath, migrated);
console.log('Migrated src/lib/problems.ts: description -> context, requirements -> functionalRequirements + nonFunctionalRequirements: []');
```

- [ ] **Step 4: Run the migration script**

Run: `cd ultimate-sd && pnpm exec tsx scripts/migrate-problem-fields.ts`
Expected: prints `Migrated src/lib/problems.ts: ...`

- [ ] **Step 5: Manually fix the dummy problem in `getProblemBySlug`**

The migration script renames fields inside the `PROBLEMS` array and the `getProblemBySlug` dummy object alike (both use the same `description:`/`requirements:` patterns), so this should already be handled. Verify by reading the top of the file:

Run: `cd ultimate-sd && sed -n '1,20p' src/lib/problems.ts`
Expected output includes:

```ts
    return {
      id: slug,
      title: 'Custom Problem',
      slug: slug,
      context: 'Custom user-defined problem.',
      difficulty: 'Medium',
      category: 'Custom',
      companies: [],
      functionalRequirements: [],
      nonFunctionalRequirements: [],
    };
```

If it doesn't match (e.g. the regex missed this object because of formatting differences), edit it by hand to match the above.

- [ ] **Step 6: Fix remaining `.description`/`.requirements` usages across the app**

In `ultimate-sd/src/lib/help-langgraph.ts`, change:
```ts
Description: ${problem.description}
```
to:
```ts
Description: ${problem.context}
```
and change:
```ts
Key Requirements: ${problem.requirements?.join(', ') || 'Not specified'}
```
to:
```ts
Key Requirements: ${problem.functionalRequirements?.join(', ') || 'Not specified'}
```

In `ultimate-sd/src/lib/langgraph.ts`, change:
```ts
Problem: "${problem.title}" — ${problem.description}
```
to:
```ts
Problem: "${problem.title}" — ${problem.context}
```

In `ultimate-sd/src/app/api/ai/evaluate/route.ts`, change:
```ts
    const problemDesc = problemDetails?.description || '';
```
to:
```ts
    const problemDesc = problemDetails?.context || '';
```

In `ultimate-sd/src/app/practice/[slug]/page.tsx`, change:
```ts
    description: `AI-powered practice for ${problem.title}. ${problem.description}`,
```
to:
```ts
    description: `AI-powered practice for ${problem.title}. ${problem.context}`,
```

In `ultimate-sd/src/components/ProblemCard.tsx`, change:
```tsx
            {problem.description}
```
to:
```tsx
            {problem.context}
```

In `ultimate-sd/src/components/ChatInterface.tsx`, change:
```tsx
              <p className="text-xs text-muted-foreground truncate">{problem.description}</p>
```
to:
```tsx
              <p className="text-xs text-muted-foreground truncate">{problem.context}</p>
```

- [ ] **Step 7: Verify the build passes**

Run: `cd ultimate-sd && pnpm exec tsc --noEmit`
Expected: PASS, no errors.

- [ ] **Step 8: Run the full unit test suite**

Run: `cd ultimate-sd && pnpm test -- run`
Expected: PASS, no regressions. (If any test fixture still references `description`/`requirements` on a `SystemDesignProblem` literal, fix that fixture to use `context`/`functionalRequirements`/`nonFunctionalRequirements` instead.)

- [ ] **Step 9: Delete the one-off migration script**

```bash
cd ultimate-sd && git rm scripts/migrate-problem-fields.ts
```

- [ ] **Step 10: Commit**

```bash
cd ultimate-sd && git add src/types/index.ts src/lib/problems.ts src/lib/help-langgraph.ts src/lib/langgraph.ts src/app/api/ai/evaluate/route.ts src/app/practice/[slug]/page.tsx src/components/ProblemCard.tsx src/components/ChatInterface.tsx
git commit -m "refactor: replace description/requirements with structured context/functionalRequirements/nonFunctionalRequirements"
```

---

### Task 3: Problem-content validator

**Files:**
- Create: `ultimate-sd/src/lib/problem-validation.ts`
- Create: `ultimate-sd/scripts/validate-problems.ts`
- Modify: `ultimate-sd/package.json` (add `validate:problems` script)
- Test: `ultimate-sd/src/lib/__tests__/problem-validation.test.ts`

**Interfaces:**
- Consumes: `SystemDesignProblem` (Task 2), `resolvePhaseSteps`/`getGenericFallbackSteps`/`resolveEvaluationPhaseKey` (Task 1 + existing), `getStepsForProblem` (existing, `src/lib/problem-steps.ts`), `PROBLEMS` (existing, `src/lib/problems.ts`).
- Produces: `ProblemContentSchema: z.ZodObject` and `validateProblem(problem: SystemDesignProblem): { slug: string; contentErrors: string[]; missingPhases: ('HLD' | 'LLD')[] }` (exports from `src/lib/problem-validation.ts`), used by the CLI script.

- [ ] **Step 1: Write the failing test**

Create `ultimate-sd/src/lib/__tests__/problem-validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { SystemDesignProblem } from '@/types';
import { validateProblem } from '../problem-validation';

function makeProblem(overrides: Partial<SystemDesignProblem> = {}): SystemDesignProblem {
  return {
    id: '999',
    title: 'Design Widget',
    slug: 'design-widget',
    context: 'A widget system.',
    functionalRequirements: ['X'],
    nonFunctionalRequirements: [],
    difficulty: 'Easy',
    category: 'Basics',
    companies: [],
    ...overrides,
  };
}

describe('validateProblem', () => {
  it('flags a sparse context and empty non-functional requirements', () => {
    const result = validateProblem(makeProblem());
    expect(result.contentErrors.length).toBeGreaterThan(0);
    expect(result.contentErrors.some((e) => e.includes('context'))).toBe(true);
    expect(result.contentErrors.some((e) => e.includes('nonFunctionalRequirements'))).toBe(true);
  });

  it('passes content checks when context and requirements are substantial', () => {
    const result = validateProblem(
      makeProblem({
        context:
          'Users need to reserve a widget slot online. The system must handle bursts of traffic during flash sales.',
        functionalRequirements: ['Users can reserve a widget slot for a specific time window'],
        nonFunctionalRequirements: ['Support 10K concurrent reservations with <200ms p99 latency'],
      })
    );
    expect(result.contentErrors).toEqual([]);
  });

  it('always reports zero missing phases because the resolved steps are backfilled', () => {
    const result = validateProblem(makeProblem());
    expect(result.missingPhases).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ultimate-sd && pnpm exec vitest run src/lib/__tests__/problem-validation.test.ts`
Expected: FAIL with "Cannot find module '../problem-validation'".

- [ ] **Step 3: Implement `src/lib/problem-validation.ts`**

Create `ultimate-sd/src/lib/problem-validation.ts`:

```ts
import { z } from 'zod';
import type { SystemDesignProblem } from '@/types';
import { getStepsForProblem } from './problem-steps';
import { getGenericFallbackSteps, resolveEvaluationPhaseKey, resolvePhaseSteps } from './step-journey';

export const ProblemContentSchema = z.object({
  context: z
    .string()
    .min(40, 'context must be at least 40 characters (a real 2-3 sentence scenario, not a one-liner)'),
  functionalRequirements: z
    .array(z.string().min(15, 'functionalRequirements entries must be full phrases, not single buzzwords'))
    .min(1, 'functionalRequirements must have at least one entry'),
  nonFunctionalRequirements: z
    .array(z.string().min(15, 'nonFunctionalRequirements entries must be full phrases, not single buzzwords'))
    .min(1, 'nonFunctionalRequirements must have at least one entry'),
});

export interface ProblemValidationResult {
  slug: string;
  contentErrors: string[];
  missingPhases: Array<'HLD' | 'LLD'>;
}

export function validateProblem(problem: SystemDesignProblem): ProblemValidationResult {
  const contentResult = ProblemContentSchema.safeParse(problem);
  const contentErrors = contentResult.success
    ? []
    : contentResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);

  const resolvedSteps = resolvePhaseSteps(getStepsForProblem(problem.slug), getGenericFallbackSteps(problem));
  const resolvedPhaseTypes = new Set(
    Object.entries(resolvedSteps).map(([phaseKey, steps]) =>
      resolveEvaluationPhaseKey(phaseKey, steps[0]?.phase ?? '')
    )
  );

  const missingPhases: Array<'HLD' | 'LLD'> = [];
  if (!resolvedPhaseTypes.has('hld')) missingPhases.push('HLD');
  if (!resolvedPhaseTypes.has('lld')) missingPhases.push('LLD');

  return { slug: problem.slug, contentErrors, missingPhases };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd ultimate-sd && pnpm exec vitest run src/lib/__tests__/problem-validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the CLI script**

Create `ultimate-sd/scripts/validate-problems.ts`:

```ts
import { PROBLEMS } from '../src/lib/problems';
import { validateProblem } from '../src/lib/problem-validation';

let hasErrors = false;

for (const problem of PROBLEMS) {
  const result = validateProblem(problem);

  if (result.missingPhases.length > 0) {
    hasErrors = true;
    console.error(`[structure] ${result.slug}: missing ${result.missingPhases.join(', ')} phase(s)`);
  }

  if (result.contentErrors.length > 0) {
    hasErrors = true;
    console.error(`[content] ${result.slug}:`);
    for (const error of result.contentErrors) {
      console.error(`  - ${error}`);
    }
  }
}

if (hasErrors) {
  console.error(`\n${PROBLEMS.length} problems checked, failures above.`);
  process.exit(1);
} else {
  console.log(`All ${PROBLEMS.length} problems pass validation.`);
}
```

- [ ] **Step 6: Wire up the `validate:problems` script**

In `ultimate-sd/package.json`, add a line inside `"scripts"` (after `"lint": "eslint",`):

```json
    "validate:problems": "tsx scripts/validate-problems.ts",
```

- [ ] **Step 7: Run the validator against the real catalog and confirm the expected baseline**

Run: `cd ultimate-sd && pnpm run validate:problems`
Expected: exits with code 1 and prints `[content]` errors for all 86 problems (every problem's `nonFunctionalRequirements` is `[]` post-migration, so it fails the `min(1)` check) — but **zero** `[structure]` errors, confirming Task 1's backfill guarantees every problem resolves an HLD and LLD phase. This is the intended baseline: structure is fixed now, content richness is the follow-on work.

- [ ] **Step 8: Run the full unit test suite**

Run: `cd ultimate-sd && pnpm test -- run`
Expected: PASS, no regressions.

- [ ] **Step 9: Commit**

```bash
cd ultimate-sd && git add src/lib/problem-validation.ts scripts/validate-problems.ts src/lib/__tests__/problem-validation.test.ts package.json
git commit -m "feat: add problem-content validator for HLD/LLD structure and requirement richness"
```

---

## After this plan

The validator now fails loudly on content richness for all 86 problems — that's the expected baseline per the design spec's rollout plan. The next plan should tackle content authoring in phases (flagship + Core Services first, then remaining custom-step problems, then the long tail), each PR landing bespoke `context`/`functionalRequirements`/`nonFunctionalRequirements` and, where warranted, bespoke HLD/LLD steps, gated by `pnpm run validate:problems` passing for the problems it touches.
