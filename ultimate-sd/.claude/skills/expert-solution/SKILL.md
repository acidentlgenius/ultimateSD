---
name: expert-solution
description: Author an expert solution for a problem (solutions.ts) — the strongest lever on AI evaluation quality. Use when a problem grades against the generic rubric, when adding a top-tier problem, or when improving evaluation accuracy
---

# Authoring expert solutions

Expert solutions (`src/lib/solutions.ts`, `SOLUTIONS` record) are what the evaluator actually
grades against: `/api/ai/evaluate` injects "Expert Solution Context" per phase when
`getSolution(slug)` binds. Without one, the evaluator has only the problem's context + a generic
rubric. They also power the user-facing SolutionViewer (unlocked on completion or Pro plan).
Check coverage: `npx tsx scripts/content-coverage.ts` (the `sol` column).

## Structure (`ExpertSolution` interface, solutions.ts:2)

```ts
'<slug>': {
  slug: '<slug>',                    // MUST equal the problems.ts slug — a typo silently
                                     // orphans the solution (this bug shipped once already)
  title: '<Title> (Expert Guide)',
  overview: '2-3 sentences: the architecture in a nutshell and its defining decision',
  architectureMermaid: `graph TD …`, // the reference diagram; node names should match components
  components: [{ name, description, technologies: [] }],
  dataFlow: ['step 1…', 'step 2…'],  // the happy-path request narrative
  tradeoffs: { pros: [], cons: [] },
  requirements: {                    // used verbatim as the requirements-phase grading reference
    functional: [],                  // mirror (refine, don't contradict) problems.ts FRs
    nonFunctional: [],               // include the quantified targets from problems.ts NFRs
  },
}
```

## How each field is consumed (write for the consumer)

- `requirements.functional` / `.nonFunctional` → grading reference for the Requirements phase.
  Must be a superset of the problem's authored FRs/NFRs — a candidate matching the problem
  statement must never be marked wrong by the solution.
- `components` (+ mermaid node names) → grading reference for HLD/architecture phases. Name
  components the way a strong candidate would (Load Balancer, Key Generation Service), because
  the evaluator compares the candidate's diagram description against these names.
- `tradeoffs` → grounds the tradeoffs/deep-dive phases; each pro/con should be arguable, not
  a platitude.
- Scale math belongs in `overview`/`dataFlow` — cite the same numbers as the problem's context.

Gold-standard references: `design-tinyurl`, `design-payment-system`, `design-flash-sale-system`.

## Workflow

1. Read the problem's entry in `problems.ts` (context/FRs/NFRs) and its steps in
   `problem-steps.ts` — the solution must cover what the steps ask.
2. Write the entry; keep technologies illustrative (2-3 options), not prescriptive.
3. Static checks: `npx tsc --noEmit`, `npx vitest run`, and confirm binding:
   `node -e` is not enough — run `npx tsx -e "import('./src/lib/solutions').then(m => console.log(!!m.getSolution('<slug>')))"`.
4. Prove it changes evaluation (the A/B that matters): submit the same partial answer to the
   problem before and after — the "after" feedback should reference solution specifics
   (component names, the defining trade-off). Use the `verify` skill to drive the app.
5. Priority order when choosing what to author next: free problems → Start Here track →
   Core Services → most-practiced (analytics).
