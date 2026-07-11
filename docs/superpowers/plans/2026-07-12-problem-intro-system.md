# Problem Intro System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every problem gets a modular intro (story hook, computed journey map, key concepts) shown as a first-entry overlay and reopenable via a "Problem brief" button, plus inline per-step interaction hints, with an admin panel to AI-generate and persist intro content at runtime.

**Architecture:** Content resolves through three tiers — admin-generated DB rows (`ProblemIntro` Prisma model) > hand-authored bespoke code (`src/lib/problem-intros.ts`, 6 pilot problems) > derived fallback built from existing problem fields. The journey map is never authored; it is computed from the problem's resolved steps at render time. Server page loader resolves the intro and passes it to `PracticeUI`, which renders a Radix Dialog overlay. Admin generation reuses `getUserLLM` with a zod-validated structured-output prompt.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7 (Postgres), NextAuth v5, LangChain (`getUserLLM`), Tailwind v4 + existing `components/ui`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-12-problem-intro-system-design.md`

## Global Constraints

- All work happens inside `/Users/abhinavmaurya/Projects/sd_practice/ultimate-sd/` — every path below is relative to that directory. Run all commands from there.
- Package manager is `pnpm` (v11.9.0, Node >=22.13.0). Tests: `pnpm vitest run <path>`. E2E: `pnpm test:e2e`.
- No new dependencies. Use existing `zod`, `lucide-react`, `components/ui` primitives.
- Do NOT touch anything under `src/features/problem-flow-v2/` or the flow-v2 spec/plan.
- Do NOT modify `src/lib/problems.ts` content or `scripts/validate-problems.ts`.
- Follow the repo's server-action admin-guard pattern (private `requireAdmin()` per action file, copied from `src/app/actions/feature-flags.ts`).
- AI errors use the existing typed vocabulary: `ai_unavailable`, `ai_rate_limited`, `ai_failed`. Never fabricate content on failure.
- localStorage reads/writes always wrapped in `try/catch` (private-mode safety — repo convention, see `PracticeTour.tsx`).
- Commit after every task with the message given in that task.

---

### Task 1: Types, fallback builder, and localStorage key helpers

**Files:**
- Modify: `src/types/index.ts` (StepData at lines 1–9, add new interfaces after ChatMessage)
- Create: `src/lib/problem-intro.ts`
- Test: `src/lib/__tests__/problem-intro.test.ts`

**Interfaces:**
- Consumes: `SystemDesignProblem`, `StepData` from `@/types`.
- Produces: `ProblemIntroConcept { term, blurb }`, `ProblemIntroContent { hook, concepts, source }`, `StepData.interactionHint?: string`; `buildFallbackIntro(problem): ProblemIntroContent`, `TAG_CONCEPTS: Record<string, ProblemIntroConcept>`, `introSeenKey(slug): string`, `INTRO_SUPPRESS_ALL_KEY: string`. Later tasks import all of these.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/problem-intro.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  buildFallbackIntro,
  introSeenKey,
  INTRO_SUPPRESS_ALL_KEY,
  TAG_CONCEPTS,
} from '@/lib/problem-intro';
import type { SystemDesignProblem } from '@/types';

const baseProblem: SystemDesignProblem = {
  id: '99',
  title: 'Design Example',
  slug: 'design-example',
  context: 'A startup serves 10M users and its monolith is falling over during peak traffic.',
  functionalRequirements: ['Serve requests'],
  nonFunctionalRequirements: ['99.9% availability'],
  difficulty: 'Medium',
  category: 'Core Services',
  companies: ['Acme'],
  tags: ['Caching', 'Scalability'],
};

describe('buildFallbackIntro', () => {
  it('builds a hook that carries the problem context verbatim', () => {
    const intro = buildFallbackIntro(baseProblem);
    expect(intro.hook).toContain(baseProblem.context);
    expect(intro.source).toBe('derived');
  });

  it('maps known tags to concepts', () => {
    const intro = buildFallbackIntro(baseProblem);
    expect(intro.concepts).toHaveLength(2);
    expect(intro.concepts[0]).toEqual(TAG_CONCEPTS['Caching']);
  });

  it('omits concepts entirely when fewer than 2 tags map', () => {
    const intro = buildFallbackIntro({ ...baseProblem, tags: ['Caching', 'Unknown Tag'] });
    expect(intro.concepts).toEqual([]);
  });

  it('handles problems with no tags', () => {
    const intro = buildFallbackIntro({ ...baseProblem, tags: undefined });
    expect(intro.concepts).toEqual([]);
    expect(intro.hook.length).toBeGreaterThan(0);
  });
});

describe('intro seen keys', () => {
  it('namespaces the seen key by slug', () => {
    expect(introSeenKey('design-tinyurl')).toBe('sd_problem_intro_seen_v1:design-tinyurl');
  });

  it('exposes a stable suppress-all key for e2e', () => {
    expect(INTRO_SUPPRESS_ALL_KEY).toBe('sd_problem_intro_suppress_all');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/problem-intro.test.ts`
Expected: FAIL — `Cannot find module '@/lib/problem-intro'` (or equivalent resolve error).

- [ ] **Step 3: Add types**

In `src/types/index.ts`, add `interactionHint` to `StepData` (after `widgetId`, line 8):

```typescript
export interface StepData {
  phase: string;
  subStep: string;
  title: string;
  prompt: string;
  inputType: 'list' | 'textarea' | 'schema';
  placeholder?: string;
  widgetId?: string; // e.g. 'encoding-visualizer'
  interactionHint?: string; // overrides the default inputType-based hint shown under the prompt
}
```

After the `ChatMessage` interface (line 31), add:

```typescript
export interface ProblemIntroConcept {
  term: string;
  blurb: string;
}

export interface ProblemIntroContent {
  hook: string; // story-style scenario, 2–4 sentences
  concepts: ProblemIntroConcept[]; // 2–4 key concepts; empty = section hidden
  source: 'bespoke' | 'generated' | 'derived';
}
```

- [ ] **Step 4: Write the implementation**

Create `src/lib/problem-intro.ts`:

```typescript
import type { ProblemIntroConcept, ProblemIntroContent, SystemDesignProblem } from '@/types';

// The full tag vocabulary used across src/lib/problems.ts. 'System Design' is
// deliberately absent — it is too generic to yield a useful concept.
export const TAG_CONCEPTS: Record<string, ProblemIntroConcept> = {
  Caching: {
    term: 'Caching',
    blurb: 'Keep hot data in fast storage so repeated reads skip the database entirely.',
  },
  'Data Engineering': {
    term: 'Data pipelines',
    blurb: 'Move and transform large volumes of data reliably between systems.',
  },
  'Distributed Systems': {
    term: 'Distributed coordination',
    blurb: 'Many machines acting as one — expect partial failures and design for them.',
  },
  'Real-time': {
    term: 'Real-time delivery',
    blurb: 'Push updates to clients in milliseconds with sockets or streams instead of polling.',
  },
  Scalability: {
    term: 'Horizontal scaling',
    blurb: 'Handle growth by adding machines — which forces sharding, load balancing, and stateless services.',
  },
  Search: {
    term: 'Indexing & search',
    blurb: 'Precompute indexes so queries scan a handful of candidates, not the whole dataset.',
  },
};

export function buildFallbackIntro(problem: SystemDesignProblem): ProblemIntroContent {
  const mapped = (problem.tags ?? [])
    .map((tag) => TAG_CONCEPTS[tag])
    .filter((c): c is ProblemIntroConcept => Boolean(c));
  return {
    hook: `Here's the situation you've walked into: ${problem.context}`,
    // A single concept reads as an afterthought — show the section only when
    // we have at least two, otherwise hide it rather than pad it.
    concepts: mapped.length >= 2 ? mapped : [],
    source: 'derived',
  };
}

const INTRO_SEEN_KEY_PREFIX = 'sd_problem_intro_seen_v1:';

export function introSeenKey(slug: string): string {
  return `${INTRO_SEEN_KEY_PREFIX}${slug}`;
}

// Set by e2e's suppressFirstRunUx so the overlay never auto-opens in specs
// that aren't about it. Also a manual escape hatch.
export const INTRO_SUPPRESS_ALL_KEY = 'sd_problem_intro_suppress_all';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/__tests__/problem-intro.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/problem-intro.ts src/lib/__tests__/problem-intro.test.ts
git commit -m "feat: add problem intro types and derived fallback builder"
```

---

### Task 2: Bespoke pilot intros and static resolution

**Files:**
- Create: `src/lib/problem-intros.ts`
- Modify: `src/lib/problem-intro.ts` (add `getStaticProblemIntro`)
- Test: `src/lib/__tests__/problem-intro.test.ts` (extend)

**Interfaces:**
- Consumes: `buildFallbackIntro` from Task 1.
- Produces: `PROBLEM_INTROS: Record<string, Omit<ProblemIntroContent, 'source'>>` (data only, no `source` field) and `getStaticProblemIntro(problem: SystemDesignProblem): ProblemIntroContent` (bespoke → derived). Tasks 3 and 7 import both.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/problem-intro.test.ts`:

```typescript
import { getStaticProblemIntro } from '@/lib/problem-intro';
import { PROBLEM_INTROS } from '@/lib/problem-intros';

describe('getStaticProblemIntro', () => {
  it('returns the bespoke intro with source=bespoke for pilot problems', () => {
    const tinyurl: SystemDesignProblem = { ...baseProblem, slug: 'design-tinyurl' };
    const intro = getStaticProblemIntro(tinyurl);
    expect(intro.source).toBe('bespoke');
    expect(intro.hook).toBe(PROBLEM_INTROS['design-tinyurl'].hook);
  });

  it('falls back to derived for non-pilot problems', () => {
    const intro = getStaticProblemIntro({ ...baseProblem, slug: 'design-nothing-here' });
    expect(intro.source).toBe('derived');
  });

  it('every bespoke intro meets the content standard', () => {
    for (const [slug, intro] of Object.entries(PROBLEM_INTROS)) {
      expect(intro.hook.length, `${slug} hook`).toBeGreaterThanOrEqual(100);
      expect(intro.concepts.length, `${slug} concepts`).toBeGreaterThanOrEqual(2);
      expect(intro.concepts.length, `${slug} concepts`).toBeLessThanOrEqual(4);
      for (const c of intro.concepts) {
        expect(c.term.length).toBeGreaterThan(1);
        expect(c.blurb.length).toBeGreaterThan(9);
      }
    }
  });
});
```

(Move the added imports to the top of the file with the existing imports.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/problem-intro.test.ts`
Expected: FAIL — cannot resolve `@/lib/problem-intros`.

- [ ] **Step 3: Write the bespoke content file**

Create `src/lib/problem-intros.ts`. All six slugs verified to exist in `src/lib/problems.ts`:

```typescript
import type { ProblemIntroContent } from '@/types';

// Hand-authored intros for the pilot set. Keyed by slug like PROBLEM_STEPS in
// problem-steps.ts. `source` is stamped at resolution time, never stored here.
// Content standard (enforced by problem-intro.test.ts): hook ≥100 chars,
// 2–4 concepts with real blurbs.
export const PROBLEM_INTROS: Record<string, Omit<ProblemIntroContent, 'source'>> = {
  'design-tinyurl': {
    hook: "Marketing links are wrecking your company's SMS campaigns — full URLs blow past character limits and nobody trusts them. You've been asked to build the link layer for the whole business: turn any URL into a 7-character link, then redirect billions of clicks a month with the reliability of DNS. Shortening can be slow-ish; redirects can never be.",
    concepts: [
      { term: 'Base62 encoding', blurb: 'Map a numeric ID onto [a-zA-Z0-9] to get short, URL-safe keys without collisions.' },
      { term: 'Read-heavy caching', blurb: 'Redirects outnumber shortens ~100:1 — a cache in front of the store absorbs almost all reads.' },
      { term: 'Collision handling', blurb: 'Decide up front how two URLs can never map to the same key: counters, ranges, or retry-on-conflict.' },
    ],
  },
  'design-youtube': {
    hook: "You've joined the video infrastructure team the week creators started uploading 4K. Every video must be ingested, transcoded into a ladder of resolutions, and served to viewers on flaky mobile networks across the globe — while the homepage keeps recommending fresh uploads within minutes of processing.",
    concepts: [
      { term: 'Chunked upload', blurb: 'Split multi-GB files into resumable parts so one dropped packet does not restart the upload.' },
      { term: 'Transcoding pipeline', blurb: 'An async worker fleet converts each upload into multiple codecs/resolutions — queue it, never do it inline.' },
      { term: 'CDN delivery', blurb: 'Serve video bytes from edge servers near the viewer; the origin only fills cache misses.' },
      { term: 'Metadata vs blob split', blurb: 'Titles and view counts live in a database; the video bytes live in object storage. Different systems, different guarantees.' },
    ],
  },
  'design-twitter': {
    hook: "Your social app just hit the growth curve every founder dreams about — and the timeline is now the slowest page in the product. A single celebrity post has to reach 100M followers, while an average user's feed must assemble from hundreds of follows in under 200ms. Precompute, or compute on read? That tension is this whole problem.",
    concepts: [
      { term: 'Fan-out on write vs read', blurb: 'Push each post into follower timelines at write time, or assemble timelines at read time — each breaks at a different scale.' },
      { term: 'The celebrity problem', blurb: 'Accounts with millions of followers make write fan-out explode; hybrid approaches special-case them.' },
      { term: 'Timeline caching', blurb: 'Keep each user’s materialized feed in memory (e.g. Redis lists) so reads are one lookup, not a join.' },
    ],
  },
  'design-whatsapp': {
    hook: "You're building the messaging backbone for an app people use instead of SMS — which means a message can never be lost, even when the recipient's phone is off for a week. Billions of tiny messages a day flow through long-lived connections, and every one needs sent/delivered/read receipts that actually tell the truth.",
    concepts: [
      { term: 'Persistent connections', blurb: 'WebSockets/TCP keep a socket open per online device so the server can push instantly.' },
      { term: 'Offline delivery queues', blurb: 'Messages for offline users park in a per-user queue and drain when the device reconnects.' },
      { term: 'Delivery acknowledgements', blurb: 'Each tick (sent, delivered, read) is a distinct ack event flowing back through the pipeline.' },
    ],
  },
  'design-distributed-cache': {
    hook: "Your product team keeps buying bigger database instances and it keeps not being enough. You're going to build the shared cache layer every service will depend on: a fleet of memory nodes that survives machines dying mid-traffic, rebalances without a thundering herd of misses, and answers in under a millisecond.",
    concepts: [
      { term: 'Consistent hashing', blurb: 'Place keys on a hash ring so adding or losing a node remaps only a small slice of keys.' },
      { term: 'Eviction policy', blurb: 'Memory is finite — LRU/LFU decide which entries die when the cache fills.' },
      { term: 'Replication vs availability', blurb: 'Copies of hot keys survive node loss, but every copy risks serving stale data. Pick your trade-off deliberately.' },
    ],
  },
  'design-rate-limiter': {
    hook: "Last Tuesday one buggy client retried itself into 40,000 requests per second and took the public API down for everyone. You own the fix: a rate limiter in front of every endpoint that makes fair, per-user decisions in microseconds — across dozens of API servers that each see only a slice of the traffic.",
    concepts: [
      { term: 'Token bucket', blurb: 'Each user gets tokens at a steady rate; a request spends one. Allows short bursts, enforces the average.' },
      { term: 'Distributed counters', blurb: 'Limits must hold across all API servers — shared state (e.g. Redis) or sticky routing keeps counts honest.' },
      { term: 'Fail-open vs fail-closed', blurb: 'When the limiter itself is down: let traffic through (protect availability) or block it (protect the backend)?' },
    ],
  },
};
```

- [ ] **Step 4: Add static resolution**

Append to `src/lib/problem-intro.ts`:

```typescript
import { PROBLEM_INTROS } from './problem-intros';

export function getStaticProblemIntro(problem: SystemDesignProblem): ProblemIntroContent {
  const bespoke = PROBLEM_INTROS[problem.slug];
  if (bespoke) return { ...bespoke, source: 'bespoke' };
  return buildFallbackIntro(problem);
}
```

(Put the import at the top of the file with the other imports.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/__tests__/problem-intro.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/problem-intros.ts src/lib/problem-intro.ts src/lib/__tests__/problem-intro.test.ts
git commit -m "feat: add bespoke pilot intros and static intro resolution"
```

---

### Task 3: Prisma model, migration, and server-side resolver

**Files:**
- Modify: `prisma/schema.prisma` (append model after `StepSubmission`)
- Create: `src/lib/problem-intro-resolver.ts`
- Test: `src/lib/__tests__/problem-intro-resolver.test.ts`

**Interfaces:**
- Consumes: `getStaticProblemIntro` (Task 2), `prisma` from `@/lib/prisma`.
- Produces: Prisma model `ProblemIntro { id, problemSlug @unique, hook, concepts Json, createdBy?, createdAt, updatedAt }`; `getProblemIntro(problem: SystemDesignProblem): Promise<ProblemIntroContent>` (DB → static). Task 5 (page wiring) and Task 7 (actions) depend on the model; Task 5 calls the resolver.

- [ ] **Step 1: Add the Prisma model**

Append to `prisma/schema.prisma`:

```prisma
model ProblemIntro {
  id          String   @id @default(cuid())
  problemSlug String   @unique
  hook        String
  concepts    Json     // ProblemIntroConcept[]: { term, blurb }[]
  createdBy   String?  // admin user id
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 2: Run the migration and regenerate the client**

Run: `pnpm prisma migrate dev --name problem_intro`
Expected: `Your database is now in sync with your schema.` and a new folder under `prisma/migrations/*_problem_intro/`.
If no dev database is reachable, run `pnpm prisma generate` so the client compiles, note the pending migration in the commit message, and continue — nothing in Tasks 4–6 needs the table to exist.

- [ ] **Step 3: Write the failing resolver test**

Create `src/lib/__tests__/problem-intro-resolver.test.ts` (mirrors the prisma-mocking pattern in `feature-flags-server.test.ts`):

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    problemIntro: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { getProblemIntro } from '@/lib/problem-intro-resolver';
import { PROBLEM_INTROS } from '@/lib/problem-intros';
import type { SystemDesignProblem } from '@/types';

const mocked = vi.mocked(prisma, true);

const problem: SystemDesignProblem = {
  id: '1',
  title: 'Design TinyURL',
  slug: 'design-tinyurl',
  context: 'Shorten URLs at scale.',
  functionalRequirements: [],
  nonFunctionalRequirements: [],
  difficulty: 'Easy',
  category: 'Basics',
  companies: [],
  tags: ['Caching', 'Scalability'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getProblemIntro', () => {
  it('prefers a valid DB row and stamps source=generated', async () => {
    mocked.problemIntro.findUnique.mockResolvedValue({
      id: 'x',
      problemSlug: 'design-tinyurl',
      hook: 'Admin-generated hook for this problem, long enough to be real.',
      concepts: [
        { term: 'A', blurb: 'First concept blurb.' },
        { term: 'B', blurb: 'Second concept blurb.' },
      ],
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    const intro = await getProblemIntro(problem);
    expect(intro.source).toBe('generated');
    expect(intro.hook).toContain('Admin-generated');
  });

  it('falls through to bespoke when the DB row is malformed', async () => {
    mocked.problemIntro.findUnique.mockResolvedValue({
      id: 'x',
      problemSlug: 'design-tinyurl',
      hook: '',
      concepts: 'not-an-array',
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    const intro = await getProblemIntro(problem);
    expect(intro.source).toBe('bespoke');
    expect(intro.hook).toBe(PROBLEM_INTROS['design-tinyurl'].hook);
  });

  it('falls through to static when there is no DB row', async () => {
    mocked.problemIntro.findUnique.mockResolvedValue(null as never);
    const intro = await getProblemIntro({ ...problem, slug: 'design-not-piloted' });
    expect(intro.source).toBe('derived');
  });

  it('never throws when the DB lookup fails', async () => {
    mocked.problemIntro.findUnique.mockRejectedValue(new Error('db down'));
    const intro = await getProblemIntro(problem);
    expect(intro.source).toBe('bespoke');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/problem-intro-resolver.test.ts`
Expected: FAIL — cannot resolve `@/lib/problem-intro-resolver`.

- [ ] **Step 5: Write the resolver**

Create `src/lib/problem-intro-resolver.ts`:

```typescript
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getStaticProblemIntro } from '@/lib/problem-intro';
import type { ProblemIntroContent, SystemDesignProblem } from '@/types';

const DbIntroSchema = z.object({
  hook: z.string().min(1),
  concepts: z.array(z.object({ term: z.string().min(1), blurb: z.string().min(1) })),
});

// Resolution order: admin-generated DB row > bespoke code > derived fallback.
// Any DB problem (missing table, malformed row, connection failure) falls
// through silently — the intro must never block a practice session from loading.
export async function getProblemIntro(
  problem: SystemDesignProblem
): Promise<ProblemIntroContent> {
  try {
    const row = await prisma.problemIntro.findUnique({
      where: { problemSlug: problem.slug },
    });
    if (row) {
      const parsed = DbIntroSchema.safeParse({ hook: row.hook, concepts: row.concepts });
      if (parsed.success) {
        return { ...parsed.data, source: 'generated' };
      }
      console.warn(`Malformed ProblemIntro row for ${problem.slug}; using static intro.`);
    }
  } catch (error) {
    console.warn(`ProblemIntro lookup failed for ${problem.slug}; using static intro.`, error);
  }
  return getStaticProblemIntro(problem);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/__tests__/problem-intro-resolver.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/problem-intro-resolver.ts src/lib/__tests__/problem-intro-resolver.test.ts
git commit -m "feat: add ProblemIntro model and three-tier server resolver"
```

---

### Task 4: Inline per-step interaction hints

**Files:**
- Create: `src/lib/step-hints.ts`
- Modify: `src/components/StepByStepChat.tsx` (prompt block around lines 933–937; lucide import near top)
- Test: `src/lib/__tests__/step-hints.test.ts`

**Interfaces:**
- Consumes: `StepData` (with `interactionHint` from Task 1), `isDiagramSubStep` from `@/lib/step-journey`.
- Produces: `getStepInteractionHint(step: StepData): string | null`. Only `StepByStepChat` consumes it.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/step-hints.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { getStepInteractionHint } from '@/lib/step-hints';
import type { StepData } from '@/types';

const step = (overrides: Partial<StepData>): StepData => ({
  phase: 'Requirements',
  subStep: 'functional',
  title: 'T',
  prompt: 'P',
  inputType: 'list',
  ...overrides,
});

describe('getStepInteractionHint', () => {
  it('returns a hint for every input type', () => {
    for (const inputType of ['list', 'textarea', 'schema'] as const) {
      const hint = getStepInteractionHint(step({ inputType }));
      expect(hint, inputType).toBeTruthy();
    }
  });

  it('prefers an authored interactionHint', () => {
    expect(getStepInteractionHint(step({ interactionHint: 'Custom hint.' }))).toBe('Custom hint.');
  });

  it('returns null for diagram sub-steps (the canvas indicator already guides)', () => {
    expect(getStepInteractionHint(step({ subStep: 'high-level' }))).toBeNull();
  });

  it('an authored hint wins even on diagram sub-steps', () => {
    expect(
      getStepInteractionHint(step({ subStep: 'high-level', interactionHint: 'Draw it this way.' }))
    ).toBe('Draw it this way.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/step-hints.test.ts`
Expected: FAIL — cannot resolve `@/lib/step-hints`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/step-hints.ts`:

```typescript
import { isDiagramSubStep } from '@/lib/step-journey';
import type { StepData } from '@/types';

const INPUT_TYPE_HINTS: Record<StepData['inputType'], string> = {
  list: 'List one item per line — aim for 4–6 crisp entries.',
  textarea: 'Write a short structured answer; bullet points are fine.',
  schema: 'Define your tables or entities with fields and types.',
};

// Diagram sub-steps return null: StepByStepChat already renders a dedicated
// canvas status indicator for them, and two instructions would compete.
export function getStepInteractionHint(step: StepData): string | null {
  if (step.interactionHint) return step.interactionHint;
  if (isDiagramSubStep(step.subStep)) return null;
  return INPUT_TYPE_HINTS[step.inputType] ?? null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/__tests__/step-hints.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Render the hint in StepByStepChat**

In `src/components/StepByStepChat.tsx`:

1. Add to the existing `lucide-react` import: `Lightbulb`.
2. Add import: `import { getStepInteractionHint } from '@/lib/step-hints';`
3. Find the prompt block (~line 933):

```tsx
            <p className="text-muted-foreground leading-relaxed">
              {currentStep.prompt}
            </p>
```

Immediately after that `</p>`, insert:

```tsx
            {(() => {
              const hint = getStepInteractionHint(currentStep);
              return hint ? (
                <p
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/80"
                  data-testid="step-interaction-hint"
                >
                  <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                  {hint}
                </p>
              ) : null;
            })()}
```

- [ ] **Step 6: Verify the app compiles and existing tests pass**

Run: `pnpm vitest run` (full unit suite)
Expected: PASS, no regressions.
Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors in the touched files.

- [ ] **Step 7: Commit**

```bash
git add src/lib/step-hints.ts src/lib/__tests__/step-hints.test.ts src/components/StepByStepChat.tsx
git commit -m "feat: show inline interaction hint under each step prompt"
```

---

### Task 5: Intro overlay component and PracticeUI/page wiring

**Files:**
- Create: `src/components/ProblemIntroOverlay.tsx`
- Modify: `src/components/PracticeUI.tsx` (props, state, sidebar footer button ~line 495, tour mount ~line 610)
- Modify: `src/app/practice/[slug]/page.tsx` (resolve intro, pass prop)

**Interfaces:**
- Consumes: `ProblemIntroContent`, `introSeenKey`, `INTRO_SUPPRESS_ALL_KEY` (Task 1); `getProblemIntro` (Task 3); `isDiagramSubStep` from `@/lib/step-journey`; `captureClientEvent` from `@/lib/analytics-client`; Dialog primitives from `@/components/ui/dialog`.
- Produces: `<ProblemIntroOverlay problem steps intro open onOpenChange />`; `PracticeUI` gains optional prop `intro?: ProblemIntroContent | null`. Task 9's e2e depends on `data-testid="problem-intro-overlay"`, button labels "Start solving" and "Problem brief", and the suppress-all key.

- [ ] **Step 1: Create the overlay component**

Create `src/components/ProblemIntroOverlay.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ListChecks, PenTool, Table2 } from 'lucide-react';
import { isDiagramSubStep } from '@/lib/step-journey';
import { captureClientEvent } from '@/lib/analytics-client';
import type { ProblemIntroContent, StepData, SystemDesignProblem } from '@/types';

const INPUT_TYPE_ICONS = {
  list: ListChecks,
  textarea: FileText,
  schema: Table2,
} as const;

function StepIcon({ step }: { step: StepData }) {
  const Icon = isDiagramSubStep(step.subStep) ? PenTool : INPUT_TYPE_ICONS[step.inputType];
  return <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export function ProblemIntroOverlay({
  problem,
  steps,
  intro,
  open,
  onOpenChange,
}: {
  problem: SystemDesignProblem;
  steps: Record<string, StepData[]>;
  intro: ProblemIntroContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (open) {
      captureClientEvent('problem intro viewed', {
        slug: problem.slug,
        source: intro.source,
      });
    }
  }, [open, problem.slug, intro.source]);

  const phases = Object.entries(steps).filter(([, phaseSteps]) => phaseSteps.length > 0);
  const totalSteps = phases.reduce((n, [, phaseSteps]) => n + phaseSteps.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="problem-intro-overlay"
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{problem.difficulty}</Badge>
            <Badge variant="outline">{problem.category}</Badge>
          </div>
          <DialogTitle className="text-2xl">{problem.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Problem brief: scenario, session journey, and key concepts.
          </DialogDescription>
        </DialogHeader>

        {/* The scenario */}
        <section className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">
            The scenario
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{intro.hook}</p>
        </section>

        {/* Your journey */}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">
            Your journey — {totalSteps} steps
          </h4>
          <div className="space-y-3">
            {phases.map(([phaseKey, phaseSteps], phaseIndex) => (
              <div key={phaseKey} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-sm font-semibold">
                  {phaseIndex + 1}. {phaseSteps[0].phase}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {phaseSteps.map((step, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StepIcon step={step} />
                      <span className="truncate">{step.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Key concepts — hidden when empty */}
        {intro.concepts.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">
              Key concepts
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {intro.concepts.map((concept) => (
                <div key={concept.term} className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-semibold">{concept.term}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {concept.blurb}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Button className="w-full" size="lg" onClick={() => onOpenChange(false)}>
          Start solving
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire into PracticeUI**

In `src/components/PracticeUI.tsx`:

1. Add imports:

```tsx
import { ProblemIntroOverlay } from './ProblemIntroOverlay';
import { introSeenKey, INTRO_SUPPRESS_ALL_KEY } from '@/lib/problem-intro';
import type { ProblemIntroContent } from '@/types';
import { BookOpen } from 'lucide-react';
```

2. Add `intro` to BOTH the outer `PracticeUI` and inner `PracticeUIContent` prop types and destructuring (default `null`), and pass it through the provider wrapper exactly like the other props:

```tsx
  intro?: ProblemIntroContent | null;
```

3. Inside `PracticeUIContent`, next to the other `useState` calls, add intro state and first-entry gating:

```tsx
  const [introOpen, setIntroOpen] = useState(false);

  // First-entry auto-show: skipped for interviews, suppressed globally by e2e,
  // and remembered per problem. localStorage failures mean "seen".
  useEffect(() => {
    if (!intro || interviewConfig) return;
    try {
      if (localStorage.getItem(INTRO_SUPPRESS_ALL_KEY) === '1') return;
      if (localStorage.getItem(introSeenKey(problem.slug)) === '1') return;
    } catch {
      return;
    }
    setIntroOpen(true);
  }, [intro, interviewConfig, problem.slug]);

  const handleIntroOpenChange = (open: boolean) => {
    if (!open) {
      try {
        localStorage.setItem(introSeenKey(problem.slug), '1');
      } catch { /* ignore */ }
    }
    setIntroOpen(open);
  };
```

4. In the sidebar footer, directly after the "Take the tour" button block (~line 495), add:

```tsx
        {intro && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIntroOpen(true)}
            className="w-full justify-start hover:bg-muted text-muted-foreground"
          >
            <BookOpen className="h-3.5 w-3.5 mr-2" />
            Problem brief
          </Button>
        )}
```

5. Change the tour mount (~line 610) so the tour never stacks on the intro:

```tsx
      {/* First-run tour — not during timed interviews, and only once the intro is closed */}
      {!interviewConfig && !introOpen && <PracticeTour />}
```

6. Next to the tour mount, render the overlay:

```tsx
      {intro && (
        <ProblemIntroOverlay
          problem={problem}
          steps={activeSteps}
          intro={intro}
          open={introOpen}
          onOpenChange={handleIntroOpenChange}
        />
      )}
```

- [ ] **Step 3: Resolve the intro in the practice page**

In `src/app/practice/[slug]/page.tsx`:

1. Add import: `import { getProblemIntro } from '@/lib/problem-intro-resolver';`
2. After `const problem = { ...problemMetadata, steps: activeSteps };` (line 94), add:

```typescript
  const intro = await getProblemIntro(problem);
```

3. Pass it to the component: add `intro={intro}` to the `<PracticeUI …>` props.

- [ ] **Step 4: Verify compile and unit suite**

Run: `npx tsc --noEmit 2>&1 | head -20` — expected: no new errors.
Run: `pnpm vitest run` — expected: PASS.

- [ ] **Step 5: Verify in the browser**

Use the `ultimate-sd:verify` skill (build, launch, drive). Check:
1. Fresh profile → `/practice/design-tinyurl` shows the overlay (scenario, journey with phases/steps, 3 concepts) BEFORE the tour; "Start solving" closes it; the tour then auto-starts.
2. Reload → overlay does not auto-show; "Problem brief" in the sidebar reopens it.
3. A non-pilot problem (e.g. `/practice/design-web-crawler` or any non-pilot slug) shows a derived intro (hook starts with "Here's the situation you've walked into:").
4. An interview-mode session does not auto-show the overlay.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProblemIntroOverlay.tsx src/components/PracticeUI.tsx "src/app/practice/[slug]/page.tsx"
git commit -m "feat: first-entry problem intro overlay with journey map and brief reopen"
```

---

### Task 6: Generation prompt, schema, and parser (pure module)

**Files:**
- Create: `src/lib/problem-intro-generation.ts`
- Test: `src/lib/__tests__/problem-intro-generation.test.ts`

**Interfaces:**
- Consumes: `SystemDesignProblem`, `ExpertSolution` from `@/lib/solutions`.
- Produces: `GeneratedIntroSchema` (zod), `buildIntroGenerationPrompt(problem, solution): string`, `parseGeneratedIntro(raw: string): { hook, concepts } | null`. Task 7 imports all three.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/problem-intro-generation.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  buildIntroGenerationPrompt,
  GeneratedIntroSchema,
  parseGeneratedIntro,
} from '@/lib/problem-intro-generation';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: '1',
  title: 'Design TinyURL',
  slug: 'design-tinyurl',
  context: 'Shorten billions of URLs.',
  functionalRequirements: ['Shorten URL', 'Redirect'],
  nonFunctionalRequirements: ['<100ms redirects'],
  difficulty: 'Easy',
  category: 'Basics',
  companies: ['Google'],
  tags: ['Caching'],
};

const validDraft = {
  hook: 'A hook that is comfortably longer than forty characters for validation.',
  concepts: [
    { term: 'Base62', blurb: 'Encode IDs as short strings.' },
    { term: 'Caching', blurb: 'Serve hot redirects from memory.' },
  ],
};

describe('buildIntroGenerationPrompt', () => {
  it('embeds the problem fields', () => {
    const prompt = buildIntroGenerationPrompt(problem, null);
    expect(prompt).toContain('Design TinyURL');
    expect(prompt).toContain('Shorten billions of URLs.');
    expect(prompt).toContain('Shorten URL');
    expect(prompt).toContain('<100ms redirects');
  });

  it('includes expert solution grounding when available', () => {
    const prompt = buildIntroGenerationPrompt(problem, {
      slug: 'design-tinyurl',
      title: 'TinyURL',
      overview: 'Counter-based key generation with cache-aside reads.',
      components: [{ name: 'Key Generation Service', description: 'd', technologies: [] }],
      dataFlow: [],
      tradeoffs: [],
    } as never);
    expect(prompt).toContain('Counter-based key generation');
    expect(prompt).toContain('Key Generation Service');
  });
});

describe('parseGeneratedIntro', () => {
  it('parses a clean JSON response', () => {
    expect(parseGeneratedIntro(JSON.stringify(validDraft))).toEqual(validDraft);
  });

  it('strips markdown code fences', () => {
    const fenced = '```json\n' + JSON.stringify(validDraft) + '\n```';
    expect(parseGeneratedIntro(fenced)).toEqual(validDraft);
  });

  it('rejects drafts that violate the schema', () => {
    expect(parseGeneratedIntro(JSON.stringify({ hook: 'too short', concepts: [] }))).toBeNull();
    expect(parseGeneratedIntro('not json at all')).toBeNull();
  });
});

describe('GeneratedIntroSchema', () => {
  it('enforces 2-4 concepts', () => {
    expect(GeneratedIntroSchema.safeParse(validDraft).success).toBe(true);
    expect(
      GeneratedIntroSchema.safeParse({ ...validDraft, concepts: validDraft.concepts.slice(0, 1) })
        .success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/problem-intro-generation.test.ts`
Expected: FAIL — cannot resolve `@/lib/problem-intro-generation`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/problem-intro-generation.ts`:

```typescript
import { z } from 'zod';
import type { ExpertSolution } from '@/lib/solutions';
import type { SystemDesignProblem } from '@/types';

export const GeneratedIntroSchema = z.object({
  hook: z.string().min(40).max(600),
  concepts: z
    .array(
      z.object({
        term: z.string().min(2).max(60),
        blurb: z.string().min(10).max(200),
      })
    )
    .min(2)
    .max(4),
});

export type GeneratedIntro = z.infer<typeof GeneratedIntroSchema>;

export function buildIntroGenerationPrompt(
  problem: SystemDesignProblem,
  solution: ExpertSolution | null
): string {
  const solutionContext = solution
    ? `\nExpert solution overview (use this to pick accurate concepts):\n${solution.overview}\nKey components: ${solution.components.map((c) => c.name).join(', ')}`
    : '';

  return `You write introductions for system design practice problems. Write an intro for the problem below.

Return ONLY a JSON object, no markdown, matching exactly:
{"hook": string, "concepts": [{"term": string, "blurb": string}, ...]}

Rules:
- hook: 2-4 vivid second-person sentences (40-600 chars) that drop the learner into a realistic engineering scenario for this problem. Include the scale numbers from the context. No headings, no lists.
- concepts: 2-4 entries. Each term is a core technique this problem exercises (e.g. "Consistent hashing"); each blurb is ONE plain-English sentence (10-200 chars) a beginner can follow.

Problem: ${problem.title}
Context: ${problem.context}
Functional requirements: ${problem.functionalRequirements.join('; ')}
Non-functional requirements: ${problem.nonFunctionalRequirements.join('; ')}
Tags: ${(problem.tags ?? []).join(', ')}
Difficulty: ${problem.difficulty}${solutionContext}`;
}

export function parseGeneratedIntro(raw: string): GeneratedIntro | null {
  const content = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const result = GeneratedIntroSchema.safeParse(JSON.parse(content));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/__tests__/problem-intro-generation.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/problem-intro-generation.ts src/lib/__tests__/problem-intro-generation.test.ts
git commit -m "feat: add intro generation prompt, schema, and parser"
```

---

### Task 7: Admin server actions

**Files:**
- Create: `src/app/actions/problem-intros.ts`
- Test: `src/app/actions/__tests__/problem-intros.test.ts`

**Interfaces:**
- Consumes: `getUserLLM`/`AIAccessError` from `@/lib/user-llm`, `PROBLEMS`, `getSolution`, `PROBLEM_INTROS`, Task 6's generation module, `prisma`.
- Produces (Task 8 consumes all):
  - `listProblemIntroStatuses(): Promise<{ slug, title, source: 'generated'|'bespoke'|'derived', updatedAt: string|null }[]>`
  - `generateProblemIntroDraft(slug): Promise<{ ok: true; draft: GeneratedIntro } | { ok: false; error: 'ai_unavailable'|'ai_rate_limited'|'ai_failed'; message: string }>`
  - `saveProblemIntro(slug, draft: GeneratedIntro): Promise<void>` (throws on invalid input)
  - `deleteProblemIntro(slug): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `src/app/actions/__tests__/problem-intros.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/user-llm', () => ({
  getUserLLM: vi.fn(),
  AIAccessError: class AIAccessError extends Error {},
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    problemIntro: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserLLM } from '@/lib/user-llm';
import {
  deleteProblemIntro,
  generateProblemIntroDraft,
  listProblemIntroStatuses,
  saveProblemIntro,
} from '@/app/actions/problem-intros';

const mockedAuth = vi.mocked(auth);
const mockedPrisma = vi.mocked(prisma, true);
const mockedGetUserLLM = vi.mocked(getUserLLM);

function asAdmin() {
  mockedAuth.mockResolvedValue({ user: { id: 'admin-1' } } as never);
  mockedPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as never);
}

function asNonAdmin() {
  mockedAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
  mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' } as never);
}

const validDraft = {
  hook: 'A hook that is comfortably longer than forty characters for validation.',
  concepts: [
    { term: 'Base62', blurb: 'Encode IDs as short strings.' },
    { term: 'Caching', blurb: 'Serve hot redirects from memory.' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin guard', () => {
  it('rejects non-admins on every action', async () => {
    asNonAdmin();
    await expect(listProblemIntroStatuses()).rejects.toThrow('Not authorized');
    await expect(generateProblemIntroDraft('design-tinyurl')).rejects.toThrow('Not authorized');
    await expect(saveProblemIntro('design-tinyurl', validDraft)).rejects.toThrow('Not authorized');
    await expect(deleteProblemIntro('design-tinyurl')).rejects.toThrow('Not authorized');
  });
});

describe('listProblemIntroStatuses', () => {
  it('classifies db > bespoke > derived', async () => {
    asAdmin();
    mockedPrisma.problemIntro.findMany.mockResolvedValue([
      { problemSlug: 'design-youtube', updatedAt: new Date('2026-07-12T00:00:00Z') },
    ] as never);
    const statuses = await listProblemIntroStatuses();
    const bySlug = new Map(statuses.map((s) => [s.slug, s]));
    expect(bySlug.get('design-youtube')?.source).toBe('generated');
    expect(bySlug.get('design-tinyurl')?.source).toBe('bespoke');
    const derived = statuses.find((s) => s.source === 'derived');
    expect(derived).toBeDefined();
  });
});

describe('generateProblemIntroDraft', () => {
  it('returns a validated draft on success', async () => {
    asAdmin();
    mockedGetUserLLM.mockResolvedValue({
      llm: { invoke: vi.fn().mockResolvedValue({ content: JSON.stringify(validDraft) }) },
    } as never);
    const result = await generateProblemIntroDraft('design-tinyurl');
    expect(result).toEqual({ ok: true, draft: validDraft });
  });

  it('returns ai_unavailable when LLM access fails', async () => {
    asAdmin();
    mockedGetUserLLM.mockRejectedValue(new Error('no key'));
    const result = await generateProblemIntroDraft('design-tinyurl');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ai_unavailable');
  });

  it('returns ai_failed when the model output never validates', async () => {
    asAdmin();
    mockedGetUserLLM.mockResolvedValue({
      llm: { invoke: vi.fn().mockResolvedValue({ content: 'garbage' }) },
    } as never);
    const result = await generateProblemIntroDraft('design-tinyurl');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ai_failed');
  });

  it('throws on unknown slugs', async () => {
    asAdmin();
    await expect(generateProblemIntroDraft('design-nope')).rejects.toThrow('Unknown problem');
  });
});

describe('saveProblemIntro', () => {
  it('validates and upserts', async () => {
    asAdmin();
    await saveProblemIntro('design-tinyurl', validDraft);
    expect(mockedPrisma.problemIntro.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { problemSlug: 'design-tinyurl' } })
    );
  });

  it('rejects invalid drafts', async () => {
    asAdmin();
    await expect(
      saveProblemIntro('design-tinyurl', { hook: 'short', concepts: [] } as never)
    ).rejects.toThrow();
    expect(mockedPrisma.problemIntro.upsert).not.toHaveBeenCalled();
  });
});

describe('deleteProblemIntro', () => {
  it('deletes the row', async () => {
    asAdmin();
    await deleteProblemIntro('design-tinyurl');
    expect(mockedPrisma.problemIntro.deleteMany).toHaveBeenCalledWith({
      where: { problemSlug: 'design-tinyurl' },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/actions/__tests__/problem-intros.test.ts`
Expected: FAIL — cannot resolve `@/app/actions/problem-intros`.

- [ ] **Step 3: Write the actions**

Create `src/app/actions/problem-intros.ts`:

```typescript
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { HumanMessage } from '@langchain/core/messages';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';
import { PROBLEMS } from '@/lib/problems';
import { getSolution } from '@/lib/solutions';
import { PROBLEM_INTROS } from '@/lib/problem-intros';
import {
  buildIntroGenerationPrompt,
  GeneratedIntroSchema,
  parseGeneratedIntro,
  type GeneratedIntro,
} from '@/lib/problem-intro-generation';

// Same guard shape as src/app/actions/feature-flags.ts — repo convention is a
// private copy per action file.
async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  return user.id;
}

export type ProblemIntroStatus = {
  slug: string;
  title: string;
  source: 'generated' | 'bespoke' | 'derived';
  updatedAt: string | null;
};

export async function listProblemIntroStatuses(): Promise<ProblemIntroStatus[]> {
  await requireAdmin();
  const rows = await prisma.problemIntro.findMany({
    select: { problemSlug: true, updatedAt: true },
  });
  const bySlug = new Map(rows.map((r) => [r.problemSlug, r.updatedAt.toISOString()]));
  return PROBLEMS.map((p) => ({
    slug: p.slug,
    title: p.title,
    source: bySlug.has(p.slug) ? 'generated' : PROBLEM_INTROS[p.slug] ? 'bespoke' : 'derived',
    updatedAt: bySlug.get(p.slug) ?? null,
  }));
}

export type GenerateIntroResult =
  | { ok: true; draft: GeneratedIntro }
  | { ok: false; error: 'ai_unavailable' | 'ai_rate_limited' | 'ai_failed'; message: string };

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status =
    (error as Error & { status?: number; code?: number }).status ??
    (error as Error & { status?: number; code?: number }).code;
  if (status === 429) return true;
  return /rate.?limit|429|quota|resource.?exhausted/i.test(error.message);
}

export async function generateProblemIntroDraft(slug: string): Promise<GenerateIntroResult> {
  const adminId = await requireAdmin();
  const problem = PROBLEMS.find((p) => p.slug === slug);
  if (!problem) {
    throw new Error(`Unknown problem: ${slug}`);
  }

  let llm;
  try {
    ({ llm } = await getUserLLM(adminId, { temperature: 0.7, problemSlug: slug }));
  } catch (error) {
    const message =
      error instanceof AIAccessError ? error.message : 'AI generation not available.';
    return { ok: false, error: 'ai_unavailable', message };
  }

  const prompt = buildIntroGenerationPrompt(problem, getSolution(slug));
  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    let draft = parseGeneratedIntro(response.content as string);
    if (!draft) {
      // One corrective retry, mirroring the evaluate route's pattern.
      const retry = await llm.invoke([
        new HumanMessage(
          `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object.`
        ),
      ]);
      draft = parseGeneratedIntro(retry.content as string);
    }
    if (!draft) {
      return {
        ok: false,
        error: 'ai_failed',
        message: 'The model returned malformed content twice. Try again.',
      };
    }
    return { ok: true, draft };
  } catch (error) {
    if (isRateLimitError(error)) {
      return {
        ok: false,
        error: 'ai_rate_limited',
        message: 'The AI provider is rate-limiting requests. Wait a moment and try again.',
      };
    }
    return {
      ok: false,
      error: 'ai_failed',
      message: 'Generation hit a temporary problem. Nothing was saved — try again.',
    };
  }
}

export async function saveProblemIntro(slug: string, draft: GeneratedIntro): Promise<void> {
  const adminId = await requireAdmin();
  const parsed = GeneratedIntroSchema.parse(draft);
  await prisma.problemIntro.upsert({
    where: { problemSlug: slug },
    update: { hook: parsed.hook, concepts: parsed.concepts },
    create: {
      problemSlug: slug,
      hook: parsed.hook,
      concepts: parsed.concepts,
      createdBy: adminId,
    },
  });
  revalidatePath('/admin');
  revalidatePath(`/practice/${slug}`);
}

export async function deleteProblemIntro(slug: string): Promise<void> {
  await requireAdmin();
  await prisma.problemIntro.deleteMany({ where: { problemSlug: slug } });
  revalidatePath('/admin');
  revalidatePath(`/practice/${slug}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/app/actions/__tests__/problem-intros.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/problem-intros.ts src/app/actions/__tests__/problem-intros.test.ts
git commit -m "feat: admin server actions for intro generation and persistence"
```

---

### Task 8: Admin panel UI

**Files:**
- Create: `src/app/admin/ProblemIntrosPanel.tsx`
- Modify: `src/app/admin/AdminDashboard.tsx` (extend `AdminTab` union at line 27, add tab button after the Feature Flags button ~line 110, add render branch ~line 135)

**Interfaces:**
- Consumes: all four server actions from Task 7.
- Produces: `<ProblemIntrosPanel />` (no props), a new `'intros'` admin tab.

- [ ] **Step 1: Create the panel**

Create `src/app/admin/ProblemIntrosPanel.tsx`:

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import {
  deleteProblemIntro,
  generateProblemIntroDraft,
  listProblemIntroStatuses,
  saveProblemIntro,
  type ProblemIntroStatus,
} from '@/app/actions/problem-intros';
import type { GeneratedIntro } from '@/lib/problem-intro-generation';

const SOURCE_BADGE: Record<ProblemIntroStatus['source'], string> = {
  generated: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  bespoke: 'bg-green-500/10 text-green-600 border-green-500/30',
  derived: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30',
};

export function ProblemIntrosPanel() {
  const [statuses, setStatuses] = useState<ProblemIntroStatus[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<GeneratedIntro | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    startTransition(async () => {
      setStatuses(await listProblemIntroStatuses());
    });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = statuses.find((s) => s.slug === selectedSlug) ?? null;

  const handleGenerate = (slug: string) =>
    startTransition(async () => {
      setError(null);
      setDraft(null);
      const result = await generateProblemIntroDraft(slug);
      if (result.ok) {
        setDraft(result.draft);
      } else {
        setError(`${result.error}: ${result.message}`);
      }
    });

  const handleSave = (slug: string) =>
    startTransition(async () => {
      if (!draft) return;
      setError(null);
      try {
        await saveProblemIntro(slug, draft);
        setDraft(null);
        setStatuses(await listProblemIntroStatuses());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    });

  const handleDelete = (slug: string) =>
    startTransition(async () => {
      setError(null);
      await deleteProblemIntro(slug);
      setStatuses(await listProblemIntroStatuses());
    });

  const updateConcept = (index: number, field: 'term' | 'blurb', value: string) => {
    if (!draft) return;
    const concepts = draft.concepts.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    setDraft({ ...draft, concepts });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Problem Intros</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[600px] space-y-1 overflow-y-auto">
          {statuses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {isPending ? 'Loading…' : 'No problems found.'}
            </p>
          )}
          {statuses.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => {
                setSelectedSlug(s.slug);
                setDraft(null);
                setError(null);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedSlug === s.slug ? 'bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <span className="truncate">{s.title}</span>
              <Badge variant="outline" className={SOURCE_BADGE[s.source]}>
                {s.source}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selected ? selected.title : 'Select a problem'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected && (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerate(selected.slug)}
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate with AI
                </Button>
                {selected.source === 'generated' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(selected.slug)}
                    disabled={isPending}
                    className="gap-2 text-red-600 border-red-500/30 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete (revert to {PROBLEM_HAS_BESPOKE(selected.slug) ? 'bespoke' : 'derived'})
                  </Button>
                )}
              </div>

              {error && (
                <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              {draft && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Hook
                    </label>
                    <textarea
                      value={draft.hook}
                      onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
                      rows={4}
                      className="w-full rounded-md border border-border bg-background p-2 text-sm"
                    />
                  </div>
                  {draft.concepts.map((concept, i) => (
                    <div key={i} className="space-y-1 rounded-md border border-border/60 p-3">
                      <input
                        value={concept.term}
                        onChange={(e) => updateConcept(i, 'term', e.target.value)}
                        className="w-full rounded-md border border-border bg-background p-2 text-sm font-semibold"
                        aria-label={`Concept ${i + 1} term`}
                      />
                      <textarea
                        value={concept.blurb}
                        onChange={(e) => updateConcept(i, 'blurb', e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-border bg-background p-2 text-sm"
                        aria-label={`Concept ${i + 1} blurb`}
                      />
                    </div>
                  ))}
                  <Button onClick={() => handleSave(selected.slug)} disabled={isPending}>
                    Save intro
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Small local helper so the delete button says what deletion reverts to.
import { PROBLEM_INTROS } from '@/lib/problem-intros';
function PROBLEM_HAS_BESPOKE(slug: string): boolean {
  return Boolean(PROBLEM_INTROS[slug]);
}
```

(Move the `PROBLEM_INTROS` import to the top of the file with the other imports — shown at the bottom above only for reading order.)

- [ ] **Step 2: Add the admin tab**

In `src/app/admin/AdminDashboard.tsx`:

1. Import: `import { ProblemIntrosPanel } from './ProblemIntrosPanel';`
2. Extend the union (line 27): `type AdminTab = 'users' | 'activities' | 'launch' | 'flags' | 'intros';`
3. After the Feature Flags tab button, add an identical button:

```tsx
        <button
          type="button"
          onClick={() => setTab('intros')}
          className={cn(
            'flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
            tab === 'intros'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          )}
        >
          Problem Intros
        </button>
```

4. Extend the render chain — change the final `: (<FeatureFlagsPanel />)` branch to:

```tsx
      ) : tab === 'flags' ? (
        <FeatureFlagsPanel />
      ) : (
        <ProblemIntrosPanel />
      )}
```

- [ ] **Step 3: Verify compile and full unit suite**

Run: `npx tsc --noEmit 2>&1 | head -20` — expected: no new errors.
Run: `pnpm vitest run` — expected: PASS.

- [ ] **Step 4: Verify in the browser**

Use the `ultimate-sd:verify` skill with an admin user: open `/admin` → "Problem Intros" tab → select a problem → Generate (requires an AI key; if unavailable, confirm the typed `ai_unavailable` error renders instead) → edit → Save → badge flips to `generated` → open that problem's practice page and confirm the generated hook renders in the overlay → Delete → badge reverts.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/ProblemIntrosPanel.tsx src/app/admin/AdminDashboard.tsx
git commit -m "feat: admin panel to generate, edit, and persist problem intros"
```

---

### Task 9: E2E — suppress helper update and intro spec

**Files:**
- Modify: `e2e/helpers/first-run.ts`
- Create: `e2e/problem-intro.spec.ts`

**Interfaces:**
- Consumes: `data-testid="problem-intro-overlay"`, buttons "Start solving" / "Problem brief" (Task 5), `INTRO_SUPPRESS_ALL_KEY` value `sd_problem_intro_suppress_all` (Task 1), existing `mockAiEvaluate` helper.
- Produces: green e2e suite; existing practice specs unaffected.

- [ ] **Step 1: Update the suppress helper**

In `e2e/helpers/first-run.ts`, extend the init script (and the doc comment to mention the intro overlay):

```typescript
export async function suppressFirstRunUx(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('sd_practice_tour_done_v1', '1');
    localStorage.setItem('sd_first_step_hint_dismissed', '1');
    localStorage.setItem('sd_problem_intro_suppress_all', '1');
  });
}
```

- [ ] **Step 2: Write the intro spec**

Create `e2e/problem-intro.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { mockAiEvaluate } from './helpers/ai-mocks';

// Deliberately does NOT call suppressFirstRunUx — the overlay is the subject.
// Only the tour/hint keys are pre-set so they don't stack after dismissal.
test.describe('Problem intro overlay', () => {
  test.beforeEach(async ({ page }) => {
    await mockAiEvaluate(page);
    await page.addInitScript(() => {
      localStorage.setItem('sd_practice_tour_done_v1', '1');
      localStorage.setItem('sd_first_step_hint_dismissed', '1');
    });
  });

  test('auto-shows once, dismisses, and reopens via Problem brief', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');

    const overlay = page.getByTestId('problem-intro-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.getByText(/The scenario/i)).toBeVisible();
    await expect(overlay.getByText(/Your journey/i)).toBeVisible();
    await expect(overlay.getByText(/Key concepts/i)).toBeVisible();

    await overlay.getByRole('button', { name: /Start solving/i }).click();
    await expect(overlay).toBeHidden();

    await page.getByRole('button', { name: /Problem brief/i }).click();
    await expect(overlay).toBeVisible();
    await overlay.getByRole('button', { name: /Start solving/i }).click();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();
    await expect(page.getByTestId('problem-intro-overlay')).toBeHidden();
  });

  test('step interaction hint renders under the prompt', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sd_problem_intro_suppress_all', '1');
    });
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByTestId('step-interaction-hint')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the new spec**

Run: `pnpm test:e2e -- problem-intro.spec.ts`
Expected: 2 tests PASS. (If the e2e environment needs seeding, run `pnpm seed:e2e` first — same as the existing suite.)

- [ ] **Step 4: Run the full e2e suite for regressions**

Run: `pnpm test:e2e`
Expected: all specs PASS — in particular `practice.spec.ts`, `persistence.spec.ts`, and `interview-mode.spec.ts`, which all rely on `suppressFirstRunUx` now suppressing the overlay.

- [ ] **Step 5: Commit**

```bash
git add e2e/helpers/first-run.ts e2e/problem-intro.spec.ts
git commit -m "test: e2e coverage for problem intro overlay and step hints"
```

---

## Final verification (after all tasks)

- [ ] `pnpm vitest run` — full unit suite green.
- [ ] `pnpm validate:problems` — unchanged content still validates.
- [ ] `npx tsc --noEmit` — clean.
- [ ] `pnpm test:e2e` — full e2e green.
- [ ] Browser pass via `ultimate-sd:verify`: pilot intro (bespoke), non-pilot intro (derived), admin generate/save/delete round-trip (generated), interview mode skips auto-show, tour fires only after intro dismissal.
