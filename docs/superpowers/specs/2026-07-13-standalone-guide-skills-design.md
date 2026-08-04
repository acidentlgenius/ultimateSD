# Standalone Guide Skills Design

**Date:** 2026-07-13  
**Status:** Approved for planning  
**Deliverable:** Two project Agent Skills that teach how to ship fully functional, highest-quality public system-design interview guides — independent of the practice problem library.

## Goal

Agents following these skills must be able to produce a **standalone** guide at `/guides/<slug>` that:

1. Reads as a complete interview walkthrough without any dependency on practice-session content.
2. Meets a Hello Interview / ByteByteGo–class quality bar (numbers, trade-offs, senior signals).
3. Embeds a **signature interactive widget** that lets the learner cause the failure mode the topic exists to teach.
4. Passes integrity tests and a live smoke check on the rendered page.

## Non-goals

- Authoring any real guide content in the skills-implementation pass.
- Changing guide page UI, SEO infrastructure, or the `Guide` type.
- Adding new validation scripts beyond what `guides.test.ts` already enforces.
- Updating `problem-improvement`, `problem-content`, `problem-steps`, `expert-solution`, or `docs/CONTENT_STANDARD.md`.
- Deriving guide prose from `problems.ts`, `problem-steps.ts`, `solutions.ts`, or existing files under `src/content/guides/`.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Quality bar | Content + wiring + live verify + new widgets when needed |
| Skill split | Two skills: `problem-guides` + `guide-widgets` |
| Location | `ultimate-sd/.claude/skills/` |
| Widget bar | Signature interactive moment required (not a generic filler embed) |
| Independence | Skills and authored guide content are fully independent of the current problem library |
| Skill shape | Concise companion-style `SKILL.md` each; bar defined inside the skill (no “mirror existing guide” shortcuts) |

## Architecture

```
User: "Create a fully functional guide for <topic>"
                │
                ▼
┌───────────────────────────────┐
│  problem-guides               │
│  outline → prose → SEO/FAQ    │
│  names signature moment       │
└───────────────┬───────────────┘
                │ blocks until moment named
                ▼
┌───────────────────────────────┐
│  guide-widgets                │
│  reuse registry id OR build   │
│  register → embed → interact  │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│  problem-guides (finish)      │
│  register guide → tests →     │
│  live /guides/<slug> smoke    │
└───────────────────────────────┘
```

**Infrastructure reuse (allowed):** the existing `Guide` / `GuideBlock` types (`src/lib/guides.ts`), guide pages under `src/app/guides/`, widget registry (`src/components/widgets/registry.tsx`), and `src/lib/__tests__/guides.test.ts`. These are shipping rails, not content templates.

**Content independence (required):** topic, scale numbers, APIs, deep-dive framing, FAQ, and widget narrative are authored from first principles for the topic the user named. Agents must not open problem/solution/guide content files as sources or gold standards.

**Catalog binding (shipping rail, not a content source):** today’s `guides.test.ts` requires `metadata.problemSlug` to exist in `PROBLEMS`. That is a registry constraint, not permission to read problem fields.

- If the user supplies a slug that already exists → use it for `slug` / `problemSlug` only; still author all prose from scratch.
- If the topic has no matching problem yet → **stop and ask**. Do not invent a `problems.ts` entry, do not copy fields, and do not register a guide that will fail integrity tests. Options for the user: provide an existing slug for routing, or defer registration until a problem exists.
- Allowed check: confirm slug membership via a minimal slug-list query if needed. Forbidden: reading `context`, FRs, NFRs, steps, or solutions for authoring.

## Skill 1: `problem-guides`

**Path:** `ultimate-sd/.claude/skills/problem-guides/SKILL.md`

### Description (discovery)

Use when authoring a new public system-design interview guide, shipping `/guides/<slug>` content, or when asked for a fully functional SEO guide independent of the practice problem library.

### Workflow

1. Confirm topic + search intent with the user (primary search phrase, audience level).
2. Outline sections using the required skeleton below.
3. Author a complete `Guide` object from first principles.
4. Name the signature interactive moment in one sentence; invoke **guide-widgets** and do not mark the guide done until that skill’s bar is met.
5. Register the guide in `src/content/guides/index.ts`.
6. Run integrity tests and live-open `/guides/<slug>`.

### Required section skeleton

Every guide must include, in interview order:

1. Why interviewers ask this
2. Requirements (functional + quantified non-functional)
3. Capacity estimation with concrete numbers and what decisions those numbers drive
4. API design
5. Core deep-dive (the interview-winning concept for this topic)
6. Data model / storage
7. Critical path (caching, fanout, consistency, scheduling — whatever the topic demands)
8. Common mistakes + senior signals
9. FAQ (≥4 plain-text Q&As suitable for FAQPage JSON-LD)

### Required block mix

- ≥1 `comparison` or `tradeoff`
- ≥1 `interviewNote`
- ≥1 `callout` (`tip` or `warning`)
- ≥1 `code` (API or schema)
- ≥1 `widget` embed (produced via `guide-widgets`)

### SEO / metadata bar

- `seoTitle` includes the primary search phrase
- `description` ≥120 characters and lists concrete topics covered
- ≥5 `keywords`
- Unique `id`s for every section and block
- `slug` / `problemSlug` may share a kebab id for routing convenience; they are **not** a license to copy practice-problem fields

### Explicit bans

- Reading or paraphrasing `problems.ts`, `problem-steps.ts`, `solutions.ts`, or existing `src/content/guides/*` as content sources
- Shipping without a signature widget
- Generic filler prompts with no numbers or twist (“Design the high-level architecture”)
- Registering a guide whose `problemSlug` is not in `PROBLEMS` (ask the user instead)

### Red flags — stop

- “I’ll quickly check tinyurl guide for structure”
- “I’ll pull NFRs from problems.ts so they stay consistent”
- “Ship the article now; add the widget later”
- Outline with fewer than the nine required sections

## Skill 2: `guide-widgets`

**Path:** `ultimate-sd/.claude/skills/guide-widgets/SKILL.md`

### Description (discovery)

Use when a guide needs a signature interactive demo, building/registering a widget, or embedding a working simulation in a guide page.

### Core principle

A guide is unfinished until the learner can **cause the failure mode** the topic exists to teach — with their own hands — then see why the right design wins.

### Workflow

1. Write the signature moment as one sentence.
2. Inspect **registry keys only** in `src/components/widgets/registry.tsx`. Reuse an id only if it already teaches that moment.
3. If none fit, build a new `"use client"` widget under `src/components/widgets/`, register it with `next/dynamic` in the registry, prefer existing UI primitives, no network calls.
4. Embed a `type: 'widget'` block in the deep-dive section with a title and a caption that states the exact experiment to run.
5. Live verify: open `/guides/<slug>`, perform the experiment, confirm visible behavior changes.
6. Attaching the same `widgetId` to a practice step is **out of default scope** — only if the user explicitly asks.

### Widget quality bar

- ≥1 learner-controlled input that changes visible system behavior
- Clear failing vs succeeding (or before/after) contrast
- Caption states the exact experiment
- Works at mobile viewport; controls have accessible labels

### Explicit bans

- Decorative-only charts with no learner agency
- Defaulting to a generic widget (e.g. a capacity calculator) when it is not the signature moment
- Registering an id that is never embedded, or embedding an id that is not in the registry
- Opening existing guide files to copy widget embed patterns or captions

### Red flags — stop

- “Capacity calculator is good enough for any guide”
- “Static diagram counts as interactive”
- “Registry entry without a live interaction check”

## Definition of done

A guide authored under these skills is done only when all of the following hold:

- [ ] Guide file exports a complete `Guide` and is registered in `index.ts`
- [ ] Section skeleton and block-mix bars are met; FAQ length ≥4
- [ ] Signature widget is embedded and interactive on `/guides/<slug>`
- [ ] `pnpm vitest run src/lib/__tests__/guides.test.ts` passes
- [ ] Live smoke: page loads; widget responds to one intentional interaction
- [ ] Authoring session did not use problem library / existing guide files as content sources

## Deliverables (implementation of this design)

```
ultimate-sd/.claude/skills/problem-guides/SKILL.md
ultimate-sd/.claude/skills/guide-widgets/SKILL.md
```

Plus this spec. No product feature code in the skills pass.

## Testing the skills (before treating them as shipped)

Per skill-writing discipline:

1. Baseline: ask an agent to "write a fully functional guide for <topic>" **without** the skills; note shortcuts (thin outline, no widget, copying from problem files).
2. With skills loaded: same prompt; confirm skeleton, block mix, signature widget, and independence bans are followed.
3. Pressure: "ship faster, skip the widget / reuse capacity-calculator" — skill must refuse and require the signature moment.

## Risks

| Risk | Mitigation |
|------|------------|
| Agents still open existing guides “just for structure” | Explicit ban in both skills + red-flag list |
| `problemSlug` tempts copying from `problems.ts` | Catalog binding section: slug is routing only; content must not be derived |
| Guide for a topic with no `PROBLEMS` entry fails tests | Skill requires stop-and-ask; no invented problem rows |
| Widget scope creeps into practice steps | Default scope = guide page only |
| Skills become verbose / ignored | Keep each `SKILL.md` concise; bar as checklists, not essays |
