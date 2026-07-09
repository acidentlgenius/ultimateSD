# Problem Content Standard

Every problem in `ultimate-sd/src/lib/problems.ts` must meet this bar. The bar is enforced by
`npm run validate:problems` (hard rules) and measured by `npx tsx scripts/content-coverage.ts`
(full completeness table). Content that fails the standard ships a degraded AI session:
`context` is the primary grounding for the interviewer, evaluator, and debrief prompts, and
FRs/NFRs seed the requirements phases.

## Required fields (hard rules — validator fails otherwise)

**`context`** — ≥ 40 chars by validator, **≥ 300 chars by this standard**. Must contain, in prose:
1. *Scenario*: what the system is and who uses it ("A URL shortener like bit.ly used by consumer apps and marketing teams…")
2. *Scale numbers*: concrete traffic/data magnitudes the candidate must design for ("100M redirects/day, 1M new links/day, read:write ≈ 100:1")
3. *Constraints/twists*: what makes this problem interesting ("hot links must redirect in <50ms globally; codes must not be guessable")

**`functionalRequirements`** — ≥ 3 entries, each ≥ 15 chars, each a full user-facing capability
phrase ("Generate a unique short code for any valid URL"), not a buzzword ("Analytics").

**`nonFunctionalRequirements`** — ≥ 3 entries, each ≥ 15 chars, each **quantified** where
possible: latency targets ("p99 redirect latency < 50ms"), availability ("99.99% for redirects —
reads must survive write-path outages"), scale ("sustain 10k QPS steady, 50k QPS peak"),
durability/consistency trade-offs stated explicitly.

**`difficulty`** — Easy = classic warm-up solvable in 25 min (LRU cache, parking lot);
Medium = one hard sub-problem; Hard = multiple interacting hard sub-problems at scale.

**`companies`** — ≥ 1 real company known to ask it (used by recommendations + "asked at" UI).

**`tags`** — ≥ 1 from the canonical tag list in `problem-tags.ts`. No generic "System Design" tag alone.

## Companion content (measured by coverage script, required for top-tier problems)

- **Bespoke interview steps** (`problem-steps.ts`): required for every problem in the Start Here
  track, all free problems, and all "Core Services". Generic fallback steps are acceptable only
  for experimental/long-tail problems.
- **Expert solution** (`solutions.ts`): drives evaluator grounding — required for the top 30
  (free + Start Here + Core Services). Template: architecture components, data model, scale math,
  trade-offs, common mistakes (mirror `design-tinyurl`).
- **Guide** (`src/content/guides`): required for the Start Here track and top-10 most practiced.

## Voice and style

- Address the candidate directly and neutrally; no marketing language.
- Numbers over adjectives: "500M tweets/day" not "massive scale".
- NFRs phrased as testable targets a candidate can argue about, not aspirations.
- No implementation choices in FRs/NFRs (that's the candidate's job): "p99 < 100ms feed load"
  is an NFR; "use Redis" is not.

## Batch rollout order

1. **Batch 1 (done first):** the 8 free problems — they are every new user's first impression.
2. **Batch 2:** remaining Basics + Core Services.
3. **Batch 3:** Advanced, ML-Infused, Edge Cases.

The validator runs in CI once batch 3 lands; until then run it locally before every content PR.
