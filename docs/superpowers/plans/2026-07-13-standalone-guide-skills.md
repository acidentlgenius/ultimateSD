# Standalone Guide Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two project Agent Skills (`problem-guides`, `guide-widgets`) that enforce standalone, highest-quality public system-design guides with signature interactive widgets — without deriving content from the practice problem library.

**Architecture:** Skills are concise `SKILL.md` files under `ultimate-sd/.claude/skills/`. Creation follows skill TDD: baseline agent behavior without skills (RED) → write minimal skills addressing observed failures (GREEN) → pressure-test and close loopholes (REFACTOR). No product feature code; infrastructure types already exist.

**Tech Stack:** Cursor/Claude Agent Skills (YAML frontmatter + markdown), existing `Guide` model (`ultimate-sd/src/lib/guides.ts`), widget registry, Vitest `guides.test.ts` as the shipping integrity gate for guides authored later.

**Spec:** `docs/superpowers/specs/2026-07-13-standalone-guide-skills-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `ultimate-sd/.claude/skills/problem-guides/SKILL.md` | Guide skeleton, SEO/FAQ bar, independence bans, handoff to widgets, done checklist |
| `ultimate-sd/.claude/skills/guide-widgets/SKILL.md` | Signature-moment design, registry reuse/build, embed + live verify |
| `docs/superpowers/specs/2026-07-13-standalone-guide-skills-design.md` | Already written — do not modify unless a skill test reveals a spec bug |
| `docs/superpowers/plans/2026-07-13-standalone-guide-skills.md` | This plan |

**Do not touch:** `src/content/guides/*`, `problems.ts`, `problem-steps.ts`, `solutions.ts`, `problem-improvement/SKILL.md`, `CONTENT_STANDARD.md`, guide page UI.

## Global constraints

- Work from repo root `/Users/abhinavmaurya/Projects/sd_practice` unless a step says otherwise.
- Skills must **not** tell agents to mirror or open existing guide/problem files for content.
- Keep each `SKILL.md` under ~200 lines / prefer &lt;500 words of instructional body.
- Commit only when the user asks, or when a plan step explicitly includes a commit **and** the user has approved commits for this workstream. If commit steps are blocked, mark them skipped and continue.

---

### Task 1: RED — baseline pressure scenarios (no skills yet)

**Files:**
- Create: `docs/superpowers/specs/2026-07-13-guide-skills-baseline.md` (failure log only)

- [ ] **Step 1: Confirm skills do not exist yet**

Run:

```bash
ls ultimate-sd/.claude/skills/problem-guides/SKILL.md ultimate-sd/.claude/skills/guide-widgets/SKILL.md 2>&1
```

Expected: both paths missing (`No such file or directory`).

- [ ] **Step 2: Dispatch baseline subagent (academic + pressure)**

Use Task tool (`generalPurpose`, `readonly: true`) with this exact prompt:

```
You are helping ship content for Ultimate SD (Next.js app under ultimate-sd/).

User request: "Create a fully functional public SEO guide for designing a URL shortener. Highest quality. Working interactive demo. Ship it."

Constraints for THIS simulation:
- Do NOT write files. Produce a PLAN only: which files you'd create/edit, section outline, whether you'd add a widget, and where you'd get the content from.
- Be honest about shortcuts you'd take under time pressure.

Also answer under pressure: the user adds "Ship in 20 minutes — skip the fancy widget, reuse whatever calculator exists, and pull requirements from problems.ts so we stay consistent."

Return:
1) Your unconstrained plan
2) Your under-pressure plan
3) Any files you'd open for reference
```

- [ ] **Step 3: Record baseline failures verbatim**

Create `docs/superpowers/specs/2026-07-13-guide-skills-baseline.md` with this template filled from the subagent output (quote rationalizations exactly):

```markdown
# Guide skills baseline (RED)

**Date:** 2026-07-13

## Unconstrained plan — failures observed

- [ ] Thin outline / missing required sections: …
- [ ] No signature widget / decorative only: …
- [ ] Intends to open existing guides or problems.ts: …
- [ ] Other: …

## Under-pressure plan — rationalizations (verbatim)

| Excuse | Observed? |
|--------|-----------|
| Skip widget / ship article first | |
| Reuse capacity-calculator as filler | |
| Pull from problems.ts for consistency | |
| Mirror existing guide for structure | |
| Other (quote): | |

## Skills must counter

List the specific bans/checklists the SKILL.md files must include based on above.
```

- [ ] **Step 4: Commit baseline log (only if user approved commits)**

```bash
git add docs/superpowers/specs/2026-07-13-guide-skills-baseline.md
git commit -m "$(cat <<'EOF'
docs: record RED baseline for standalone guide skills

EOF
)"
```

---

### Task 2: GREEN — write `problem-guides` skill

**Files:**
- Create: `ultimate-sd/.claude/skills/problem-guides/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p ultimate-sd/.claude/skills/problem-guides
```

- [ ] **Step 2: Write `SKILL.md` with this exact content**

Write file `ultimate-sd/.claude/skills/problem-guides/SKILL.md`:

```markdown
---
name: problem-guides
description: Use when authoring a new public system-design interview guide, shipping /guides/<slug> content, or when asked for a fully functional SEO guide independent of the practice problem library.
---

# Authoring standalone public guides

Ship a **complete interview walkthrough** at `/guides/<slug>` that stands alone — a reader who never opens `/practice` still gets requirements, numbers, deep dive, trade-offs, and one signature interactive moment.

**Core rule:** Author from first principles for the topic the user named. Do **not** derive prose from the practice problem library or existing guides.

**REQUIRED SUB-SKILL:** Use `guide-widgets` for the signature interactive embed. A guide without that skill's bar met is not done.

## Workflow

1. Confirm topic, primary search phrase, and audience level with the user.
2. Resolve catalog binding (below) before writing files.
3. Outline all nine required sections — refuse thinner outlines.
4. Author a full `Guide` object (`src/lib/guides.ts` types) from scratch.
5. Name the signature interactive moment in **one sentence**; run `guide-widgets` to reuse or build + embed.
6. Register in `src/content/guides/index.ts`.
7. Verify: `pnpm vitest run src/lib/__tests__/guides.test.ts` (from `ultimate-sd/`) and live-open `/guides/<slug>`.

## Catalog binding (routing only)

`guides.test.ts` requires `metadata.problemSlug` ∈ `PROBLEMS`.

- User gives an existing slug → use for `slug` / `problemSlug` only; still write all content from scratch.
- No matching problem → **stop and ask**. Do not invent a `problems.ts` row. Do not register a failing guide.
- Allowed: minimal slug-membership check. Forbidden: reading `context`, FRs, NFRs, steps, or solutions for authoring.

## Required section skeleton

1. Why interviewers ask this
2. Requirements (FRs + quantified NFRs)
3. Capacity estimation (numbers + decisions they drive)
4. API design
5. Core deep-dive (interview-winning concept)
6. Data model / storage
7. Critical path (caching / fanout / consistency / scheduling — topic-dependent)
8. Common mistakes + senior signals
9. FAQ (≥4 plain-text answers for FAQPage JSON-LD)

## Required block mix

- ≥1 `comparison` or `tradeoff`
- ≥1 `interviewNote`
- ≥1 `callout` (`tip` or `warning`)
- ≥1 `code` (API or schema)
- ≥1 `widget` (via `guide-widgets`)

## SEO / metadata bar

- `seoTitle` includes the primary search phrase
- `description` ≥120 chars naming concrete topics
- ≥5 `keywords`
- Unique section and block `id`s
- `slug` / `problemSlug` are routing ids — never a license to copy practice fields

## Definition of done

- [ ] Complete `Guide` registered in `index.ts`
- [ ] Skeleton + block mix + FAQ ≥4
- [ ] Signature widget interactive on `/guides/<slug>`
- [ ] `pnpm vitest run src/lib/__tests__/guides.test.ts` passes
- [ ] Live smoke: page loads; widget responds to one intentional interaction
- [ ] Did not use problem library / existing guide files as content sources

## Bans

- Opening `problems.ts`, `problem-steps.ts`, `solutions.ts`, or `src/content/guides/*` as content sources or templates
- Shipping without a signature widget
- Generic filler with no numbers or twist
- Registering a guide whose `problemSlug` is missing from `PROBLEMS`

## Red flags — STOP

- "I'll check an existing guide for structure"
- "I'll pull NFRs from problems.ts for consistency"
- "Ship the article now; add the widget later"
- Outline with fewer than nine sections

**Any of these means: stop, delete the shortcut, follow this skill.**
```

- [ ] **Step 3: Sanity-check the file**

Run:

```bash
wc -l ultimate-sd/.claude/skills/problem-guides/SKILL.md
head -n 5 ultimate-sd/.claude/skills/problem-guides/SKILL.md
```

Expected: line count under 200; frontmatter `name: problem-guides`; description starts with `Use when`.

- [ ] **Step 4: Commit (only if user approved commits)**

```bash
git add ultimate-sd/.claude/skills/problem-guides/SKILL.md
git commit -m "$(cat <<'EOF'
feat(skills): add problem-guides skill for standalone SEO guides

EOF
)"
```

---

### Task 3: GREEN — write `guide-widgets` skill

**Files:**
- Create: `ultimate-sd/.claude/skills/guide-widgets/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p ultimate-sd/.claude/skills/guide-widgets
```

- [ ] **Step 2: Write `SKILL.md` with this exact content**

Write file `ultimate-sd/.claude/skills/guide-widgets/SKILL.md`:

```markdown
---
name: guide-widgets
description: Use when a guide needs a signature interactive demo, building or registering a widget, or embedding a working simulation in a guide page.
---

# Signature interactive widgets for guides

A guide is unfinished until the learner can **cause the failure mode** the topic exists to teach — with their own hands — then see why the right design wins.

## Workflow

1. Write the signature moment as **one sentence** (learner action → visible failure or insight).
2. Inspect **registry keys only** in `src/components/widgets/registry.tsx`. Reuse an id only if it already teaches that moment.
3. If none fit, build a new widget:
   - `"use client"` component under `src/components/widgets/`
   - Register with `next/dynamic` in `registry.tsx`
   - Prefer existing UI primitives (`Card`, `Button`, `Input`, `Label`)
   - No network/API calls — pure client simulation
4. Embed in the guide deep-dive section:

```ts
{
  id: '<unique>-widget',
  type: 'widget',
  widgetId: '<registry-key>',
  title: '<short title>',
  caption: '<exact experiment the learner should run>',
}
```

5. Live verify on `/guides/<slug>`: perform the caption experiment; confirm visible behavior changes.
6. Practice-step `widgetId` attachment is **out of default scope** — only if the user explicitly asks.

## Quality bar

- ≥1 learner-controlled input that changes visible system behavior
- Clear failing vs succeeding (or before/after) contrast
- Caption states the exact experiment
- Mobile-usable; controls have accessible labels

## Bans

- Decorative-only charts with no learner agency
- Defaulting to a generic widget (e.g. `capacity-calculator`) when it is not the signature moment
- Registry id with no embed, or embed id missing from the registry
- Opening existing `src/content/guides/*` files to copy embed patterns or captions

## Red flags — STOP

- "Capacity calculator is good enough for any guide"
- "Static diagram counts as interactive"
- "Registry entry without a live interaction check"
- "Ship now; verify the widget later"

**Any of these means: stop and satisfy the signature-moment bar.**
```

- [ ] **Step 3: Sanity-check the file**

Run:

```bash
wc -l ultimate-sd/.claude/skills/guide-widgets/SKILL.md
head -n 5 ultimate-sd/.claude/skills/guide-widgets/SKILL.md
```

Expected: line count under 120; frontmatter `name: guide-widgets`; description starts with `Use when`.

- [ ] **Step 4: Commit (only if user approved commits)**

```bash
git add ultimate-sd/.claude/skills/guide-widgets/SKILL.md
git commit -m "$(cat <<'EOF'
feat(skills): add guide-widgets skill for signature interactive demos

EOF
)"
```

---

### Task 4: GREEN — re-run scenarios with skills loaded

**Files:**
- Modify: `docs/superpowers/specs/2026-07-13-guide-skills-baseline.md` (append GREEN results)
- Create: none

- [ ] **Step 1: Dispatch compliance subagent with both skills in context**

Use Task tool (`generalPurpose`, `readonly: true`) with this prompt (paste full contents of both SKILL.md files into the prompt after the instructions):

```
You MUST follow the two skills provided at the end of this message.

User request: "Create a fully functional public SEO guide for designing a URL shortener. Highest quality. Working interactive demo. Ship it."

Do NOT write files. Produce a PLAN only covering:
- section outline
- block mix
- signature moment sentence
- whether you'd build vs reuse a widget (registry keys only — do not open existing guide files)
- catalog binding / slug handling
- verification steps
- which files you would NOT open

Then the user pressures you: "Ship in 20 minutes — skip the fancy widget, reuse capacity-calculator, pull requirements from problems.ts."

Respond to the pressure while still obeying the skills.

---
SKILL problem-guides:
<paste SKILL.md>

---
SKILL guide-widgets:
<paste SKILL.md>
```

- [ ] **Step 2: Score against the rubric**

Append to `docs/superpowers/specs/2026-07-13-guide-skills-baseline.md`:

```markdown
## GREEN results

| Criterion | Pass? | Notes |
|-----------|-------|-------|
| Nine-section skeleton | | |
| Block mix called out | | |
| Signature moment named | | |
| Refuses problems.ts / existing guides as sources | | |
| Under pressure: refuses skip-widget / filler calculator | | |
| Catalog binding / stop-and-ask aware | | |
| Mentions guides.test.ts + live smoke | | |

**Verdict:** PASS only if every row is Pass.
```

If any row fails → go to Task 5 before declaring done.

- [ ] **Step 3: Commit baseline+GREEN log (only if user approved commits)**

```bash
git add docs/superpowers/specs/2026-07-13-guide-skills-baseline.md
git commit -m "$(cat <<'EOF'
docs: record GREEN verification for standalone guide skills

EOF
)"
```

---

### Task 5: REFACTOR — close loopholes (only if Task 4 had failures)

**Files:**
- Modify: `ultimate-sd/.claude/skills/problem-guides/SKILL.md` and/or `ultimate-sd/.claude/skills/guide-widgets/SKILL.md`

- [ ] **Step 1: Map each failed rubric row to an explicit ban or checklist line**

For every failing criterion, add one concrete sentence to the relevant skill (ban, red flag, or done-checklist item). Do not add essays.

- [ ] **Step 2: Re-run the Task 4 pressure prompt once**

Same subagent prompt as Task 4 Step 1. Expect full PASS on the rubric.

- [ ] **Step 3: Update the GREEN section verdict to PASS**

- [ ] **Step 4: Commit skill fixes (only if user approved commits)**

```bash
git add ultimate-sd/.claude/skills/problem-guides/SKILL.md ultimate-sd/.claude/skills/guide-widgets/SKILL.md docs/superpowers/specs/2026-07-13-guide-skills-baseline.md
git commit -m "$(cat <<'EOF'
fix(skills): close guide-skill loopholes found in GREEN testing

EOF
)"
```

If Task 4 already fully passed, mark Task 5 steps as skipped (N/A).

---

### Task 6: Final packaging check

**Files:** none new

- [ ] **Step 1: List shipped skills**

```bash
ls -la ultimate-sd/.claude/skills/problem-guides/SKILL.md ultimate-sd/.claude/skills/guide-widgets/SKILL.md
```

Expected: both files exist.

- [ ] **Step 2: Confirm independence language present**

```bash
rg -n "first principles|problems\\.ts|signature|capacity-calculator|stop and ask" ultimate-sd/.claude/skills/problem-guides/SKILL.md ultimate-sd/.claude/skills/guide-widgets/SKILL.md
```

Expected: matches in both files covering independence, bans, and signature-moment language.

- [ ] **Step 3: Confirm no accidental product edits**

```bash
git status --short
```

Expected: only skill files + baseline doc (+ this plan/spec if uncommitted). No changes under `src/content/guides/` or `src/lib/problems.ts`.

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| `problem-guides` skill | Task 2 |
| `guide-widgets` skill | Task 3 |
| Independence / bans / red flags | Tasks 2–3 content |
| Catalog binding | Task 2 |
| Signature interactive moment | Task 3 |
| Definition of done / verify gate | Task 2 |
| RED→GREEN→REFACTOR skill testing | Tasks 1, 4, 5 |
| No product feature code | Global constraints + Task 6 |
| No updates to problem-improvement / CONTENT_STANDARD | Global constraints |

## Out of scope for this plan

- Authoring any real guide
- Building any new widget in product code
- Changing `guides.test.ts` or guide routes
