---
name: problem-content
description: Author or fix problem content (context, FRs, NFRs, difficulty, companies) to the platform's content standard — use when adding a new problem, improving a weak/incomplete problem, or when validate:problems fails
---

# Authoring problem content

The problem library is `src/lib/problems.ts` (array `PROBLEMS`). Content quality directly
controls AI session quality: `context` grounds the interviewer/evaluator/debrief prompts, and
FRs/NFRs are injected into `/api/ai/evaluate` and the help assistant. Thin content = generic,
ungroundable AI feedback.

## The bar (full version: /docs/CONTENT_STANDARD.md at repo root)

- **context** — 300–520 chars of prose with all three of: (1) scenario — what the system is and
  who uses it, (2) concrete scale numbers (users, QPS, data volume — realistic for that system),
  (3) the constraint/twist that makes the problem interesting. Neutral interviewer voice.
  Numbers over adjectives ("500M tweets/day", never "massive scale").
- **functionalRequirements** — 4–6 entries, each ≥15 chars, full user-facing capability phrases
  ("Generate a unique short code for any valid URL"), never buzzwords ("Analytics").
- **nonFunctionalRequirements** — 4–5 entries, each ≥15 chars, QUANTIFIED: p99 latencies,
  QPS targets, availability %, durability, consistency trade-offs stated explicitly.
  No implementation choices — "p99 < 100ms feed load" is an NFR; "use Redis" is not.
- **difficulty** — Easy = classic warm-up solvable in ~25 min; Medium = one hard sub-problem;
  Hard = multiple interacting hard sub-problems at scale.
- **companies** — ≥1 real company known to ask it. **tags** — from `src/lib/problem-tags.ts`.

Gold-standard reference entries: `design-tinyurl`, `design-whatsapp`, `design-distributed-cache`.

## Workflow

1. Read the current entry in `src/lib/problems.ts` and the standard doc.
2. Write/fix the fields. Keep the existing `id`, `slug`, `category` unless explicitly changing them.
3. Validate and measure (run from `ultimate-sd/`):
   ```bash
   npx tsx scripts/validate-problems.ts     # hard rules — must pass; also runs in CI
   npx tsx scripts/content-coverage.ts      # full per-problem completeness table
   ```
4. If editing MANY problems at once, don't hand-edit: produce a JSON file
   `{ "<slug>": { "context", "functionalRequirements": [], "nonFunctionalRequirements": [] } }`
   and apply it with `npx tsx scripts/apply-content.ts <file.json>` (anchored per-slug merge).
5. Run `npx vitest run` — problem data feeds recommendation/tag tests.

## Consistency checks when adding a NEW problem

- Slug format `design-<kebab>`; unique id (max existing id + 1); no near-duplicate of an
  existing problem (check the feed/search/cache/resilience clusters before adding).
- If the problem should be free-tier, add the slug to `FREE_PROBLEM_SLUGS` in `src/lib/plans.ts`
  (free problems must also get bespoke steps + an expert solution — see the companion skills).
- Companion content lives elsewhere and binds BY SLUG — typos silently orphan it:
  steps in `src/lib/problem-steps.ts` (`PROBLEM_STEPS`), expert solution in `src/lib/solutions.ts`,
  guide in `src/content/guides/`.

## Verifying AI grounding (the point of all this)

After a content change, confirm the evaluator actually uses it: start a session on the problem
(dev server via the `verify` skill), submit a deliberately partial answer, and check that the
feedback's "missed" items reference specifics that exist only in your new content (scale numbers,
constraint/twist, NFR targets). The evaluate payload is inspectable via the browser network tab
on `POST /api/ai/evaluate`.
