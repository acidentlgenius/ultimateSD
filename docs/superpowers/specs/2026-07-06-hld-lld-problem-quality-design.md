# HLD/LLD Problem-Content Guardrails + Remediation — Design

## Problem

`ultimate-sd`'s practice problems (86 total, in `src/lib/problems.ts` + `src/lib/problem-steps.ts`) have no enforced quality bar:

1. **No problem has a real LLD step.** The only "LLD" phase anywhere is the generic fallback's `deep_dive`, which is a deep-dive Q&A, not low-level design (classes, data structures, API contracts).
2. **31 of 47 custom-step problems skip HLD entirely** (e.g. `design-rate-limiter`, `design-instagram`, `design-whatsapp`, `design-dropbox`) — they jump from requirements straight into a narrow sub-topic.
3. **39 of 86 problems have zero custom steps**, falling back to a 3-phase generic pipeline with no problem-specific content — including OOD-tagged problems (`design-parking-lot`, `design-elevator-system`) that need a fundamentally different LLD lens (classes/interfaces/state machines, not distributed-systems LLD).
4. **`description` is a single sparse sentence** with no scenario, no functional/non-functional requirements, no scale numbers (e.g. `design-blockchain-system`: `"Decentralized ledger."`). `requirements: string[]` is 3 buzzwords, not requirement statements.
5. **Nothing enforces any of this.** No zod schema, no CI/lint check, no guarantee that a `PROBLEMS` entry has a matching, complete `PROBLEM_STEPS` entry.

Root cause of #1-#3: custom `steps` **fully replace** the generic pipeline (`problem.steps || DEFAULT_PHASE_STEPS`) instead of merging with it, so any custom problem that omits a phase simply has none.

## Goals

- Every problem has all 5 canonical phases (Requirements, HLD, LLD, Tradeoffs, Scalability) — guaranteed structurally, not by author diligence.
- Every problem's problem-statement is self-explanatory: scenario context + explicit functional/non-functional requirements, no scale-free one-liners.
- A validator that fails CI if any of the above regresses.
- OOD-style problems get an LLD lens appropriate to object-oriented design, not distributed systems.
- Remediation is phased and prioritized — flagship/Core Services problems first, long tail later — rather than an all-or-nothing rewrite.

## Non-goals

- Migrating problem content storage off static TS files into a DB/CMS.
- Rewriting the interactive step-widget system (`widgetId` components).
- New difficulty/category taxonomy changes.

## Design

### 1. Schema changes (`src/types/index.ts`)

```ts
interface SystemDesignProblem {
  id: string;
  title: string;
  slug: string;
  context: string;                     // 2-3 sentence scenario (replaces `description`)
  functionalRequirements: string[];    // full phrases, e.g. "Users can shorten a URL and get a short alias"
  nonFunctionalRequirements: string[]; // e.g. "100M redirects/day, <100ms p99 read latency"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  companies: string[];
  tags?: string[];
  steps?: Record<string, StepData[]>;
}

interface StepData {
  phase: 'Requirements' | 'HLD' | 'LLD' | 'Tradeoffs' | 'Scalability'; // was free-text
  subStep: string;
  title: string;
  prompt: string;
  inputType: 'list' | 'textarea' | 'schema';
  placeholder?: string;
  widgetId?: string;
}
```

`description`/`requirements` are removed once all 86 problems migrate (no dual-write period needed — this is a single-repo static dataset, not a live API consumers depend on).

Constraining `phase` to a union removes the need for `step-journey.ts`'s current string-matching heuristics (`phaseLabelLooksLikeHld/Lld`) for phase detection — it becomes an exact match.

### 2. Validator (`scripts/validate-problems.ts`)

A zod schema (`ProblemSchema`) run as a standalone script (and wired into CI) that checks, per problem, against its **resolved** step set (post-backfill, see #3):

- `context` non-empty, minimum length (e.g. 2+ sentences / 40+ chars).
- `functionalRequirements` and `nonFunctionalRequirements` each non-empty arrays of full phrases (min length per string, not single words).
- Resolved steps contain at least one phase `'HLD'` and at least one phase `'LLD'`.
- Every slug in `PROBLEMS` has a resolvable step set (custom or backfilled) — no silent gaps.

Run manually first against current content to establish the (expected-to-fail) baseline, then wired as a required CI check once Phase A content lands.

### 3. Steps resolution — backfill/merge (`src/lib/step-journey.ts`)

Replace full-replacement resolution with per-phase merge:

```ts
function resolveProblemSteps(problem: SystemDesignProblem): Record<string, StepData[]> {
  const custom = problem.steps ?? {};
  const generic = problem.tags?.includes('oop-design') ? GENERIC_OOD_STEPS : GENERIC_STEPS;
  return { ...generic, ...custom }; // custom phases win; missing phases backfilled from generic
}
```

Two generic templates:
- `GENERIC_STEPS` (existing, distributed-systems-flavored) — default backfill for HLD/LLD/Tradeoffs/Scalability/Requirements.
- `GENERIC_OOD_STEPS` (new) — HLD asks for class/interface breakdown and responsibilities; LLD asks for state machine / method signatures / concurrency handling. Selected via the `oop-design` tag, so it generalizes beyond just the current 2 problems.

This structurally fixes gaps #1-#3 the moment it ships — every problem gets all 5 phases with at least generic content, before any bespoke authoring happens. All call sites currently doing `problem.steps || DEFAULT_PHASE_STEPS` (`PracticeUI.tsx`, `StepByStepChat.tsx`) switch to calling `resolveProblemSteps()`.

### 4. Content remediation — phased, all 86 problems

- **Phase A — flagship + Core Services (~20-25 problems)**: bespoke `context`/FR/NFR + bespoke HLD and LLD steps. Covers Instagram, WhatsApp, Uber, Netflix, Dropbox, TinyURL, rate limiter, etc., plus `design-parking-lot`/`design-elevator-system` with OOD-flavored bespoke LLD.
- **Phase B — remaining custom-step problems missing HLD (~6)**: add bespoke HLD; LLD already backfilled generically from #3, upgraded opportunistically.
- **Phase C — long-tail generic-fallback problems (~39)**: bespoke `context`/FR/NFR at minimum; HLD/LLD stay on generic (or generic-OOD) backfill unless later prioritized.
- Authoring mechanism: LLM-drafted per problem (given title/category/existing content as input) + review against the validator, not fully hand-written — 86 problems of from-scratch bespoke content isn't realistic to sequence by hand in one pass.

### 5. Rollout

1. Ship schema + validator + backfill/merge logic first (structural fix, zero content risk — every problem immediately gets all 5 phases).
2. Run validator, confirm it fails only on content richness (`context`/FR/NFR), not structure.
3. Land Phase A, B, C incrementally; each PR must pass the validator for the problems it touches.
4. Generic backfill covers everything not yet bespoke at every point in the rollout — no problem is ever in a worse state than today.

## Testing

- Unit test for `resolveProblemSteps()`: custom-only phases merge correctly, OOD tag selects OOD generic, missing problem falls back entirely to generic.
- Validator run as its own test (`npm run validate:problems` or equivalent) — asserts on the full `PROBLEMS` array.
- Manual spot-check in the app (via `ultimate-sd:verify` skill) that a problem with only 2 custom phases now renders all 5, with backfilled ones visually consistent with custom ones.
