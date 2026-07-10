---
name: problem-improvement
description: Use when improving a problem end-to-end, deciding which problem to improve next, planning content work across the library, or when asked to make problems "world-class" or "worth selling" — the roadmap of dimensions every problem must cover and the tracker that measures them
---

# Problem improvement roadmap

A problem is a product surface with SIX dimensions, spread across four files that bind **by slug**.
Improving only `problems.ts` is the classic failure: the session still runs on generic steps and
the evaluator still grades against a generic rubric. An improvement is complete only when every
dimension required for the problem's tier is present.

## The six dimensions (roadmap per problem)

| # | Dimension | File | Owner skill | Required for |
|---|-----------|------|-------------|--------------|
| 1 | Framing: context, FRs, NFRs, difficulty, companies, tags | `src/lib/problems.ts` | problem-content | all 86 |
| 2 | Bespoke interview steps (+ `widgetId` demos) | `src/lib/problem-steps.ts` | problem-steps | free, Start Here, Core Services |
| 3 | Expert solution — evaluator grounding | `src/lib/solutions.ts` | expert-solution | free, Start Here, Core Services |
| 4 | Guide (long-form article, SEO) | `src/content/guides/` | mirror `design-tinyurl.ts` | Start Here, top-10 practiced |
| 5 | Access bindings: `FREE_PROBLEM_SLUGS` (plans.ts), `START_HERE_TRACK` (start-here.ts) | `src/lib/plans.ts`, `src/lib/start-here.ts` | this skill | as designed |
| 6 | Live verification: validators pass AND the AI evaluator cites the new content | — | verify skill | every change |

Full bar per dimension: `/docs/CONTENT_STANDARD.md` (repo root).

## Which problem next

Read `/docs/PROBLEM_TRACKER.md` (repo root). Work order: **Easy → Medium → Hard**; within a
difficulty: **Start Here → free → Core Services → rest**. Pick the first row with a non-empty
Missing column. Gold reference for "done": `design-tinyurl` (all six dimensions).

## Workflow per problem

1. Regenerate + read the tracker: `npx tsx scripts/content-coverage.ts --md` (from `ultimate-sd/`).
2. For each missing dimension, use the owner skill above — in table order (steps must exist
   before the solution, because the solution must cover what the steps ask).
3. Validate: `npx tsx scripts/validate-problems.ts && npx tsc --noEmit && npx vitest run`.
4. Verify grounding live (dimension 6): submit a partial answer on `/practice/<slug>` and confirm
   feedback cites your new specifics. See each owner skill's "verify" section.
5. Regenerate the tracker (step 1 command) — the row flips to ✅ only if you truly finished.

## Red flags

- "I improved the problem" but only `problems.ts` changed → dimensions 2–3 still missing.
- Companion entry added but tracker row unchanged → slug typo; content is silently orphaned.
- Editing `PROBLEM_TRACKER.md` by hand → it is generated; hand edits are lies and get overwritten.
- Marking done without the live evaluator check → validators can pass while AI feedback stays generic.
- A "Done ✅" long-tail row just means it meets its tier's bar — steps/solutions there are still
  upgrades when prioritizing beyond the top tier.
