---
name: problem-steps
description: Write bespoke guided-interview steps for a problem (PROBLEM_STEPS) — use when a problem runs on the generic fallback template, when adding a new problem, or when improving a problem's step journey
---

# Authoring bespoke interview steps

Steps ARE the product experience: `StepByStepChat` walks the user through them one at a time
with AI evaluation per step. Problems without an entry in `PROBLEM_STEPS`
(`src/lib/problem-steps.ts`) fall back to `GENERIC_STEPS` — a bland template that ignores what
makes the problem interesting. Check who's generic: `npx tsx scripts/content-coverage.ts`
(the `steps` column).

## Structure

`PROBLEM_STEPS['<slug>'] = { <phaseKey>: StepData[] }` with phase keys in journey order —
conventionally `requirements`, `hld`, `lld` (some problems add `tradeoffs`/`scalability`).
Each `StepData` (`src/types/index.ts`):

```ts
{
  phase: 'Requirements',        // display name shown in sidebar
  subStep: 'functional',        // evaluation key — MUST map via resolveEvaluationSubStepKey
  title: 'Functional Requirements',
  prompt: '…the actual question…',
  inputType: 'list' | 'textarea' | 'schema',
  placeholder: 'e.g. …',
  widgetId?: 'cache-visualizer', // optional interactive demo from widgets/registry.tsx
}
```

Rules that keep evaluation working:
- `subStep` values feed `/api/ai/evaluate`'s rubric selection (`resolveEvaluationSubStepKey` in
  `src/lib/step-journey.ts`). Use the established keys: `functional`, `non-functional`,
  `constraints` (requirements); `api`, `high-level`, `database` (hld); `data-flow`,
  `deep-dive`, `algorithms` (lld). A novel subStep silently gets no rubric.
- Diagram canvas appears only for steps where `isDiagramSubStep(subStep)` is true
  (`high-level`, `data-flow`) — every problem's journey should include at least one.
- Every journey must resolve both an HLD and an LLD phase or `validate:problems` fails.
- `inputType: 'list'` for enumerations (FRs), `'schema'` only for data-model steps,
  `'textarea'` for everything else.

## Writing good prompts

- Anchor each prompt in the problem's context/NFRs — reference its actual scale numbers and
  twist ("With one celebrity write touching 100M timelines, how do you build the feed?"), never
  generic filler ("Design the high-level architecture").
- Ask ONE thing per step; the placeholder shows the expected answer's *shape*, not its content.
- 6–10 steps total is the sweet spot (matches a 45–60 min interview).
- If a relevant interactive widget exists in `src/components/widgets/registry.tsx`, attach it
  via `widgetId` on the step where it teaches the concept being asked.

## Verify

1. `npx tsx scripts/validate-problems.ts` (phase completeness) and `npx vitest run`.
2. Drive it live (see the `verify` skill): open `/practice/<slug>`, confirm the sidebar shows
   your phases, the diagram appears on the intended steps, and submit one step to confirm the
   evaluator's rubric matches the subStep's intent.
3. E2E specs that touch practice pages must call `suppressFirstRunUx(page)`
   (`e2e/helpers/first-run.ts`) or the first-run tour overlay will block clicks.
