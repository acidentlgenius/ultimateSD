# Plan B: Fresher Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the flag-gated `fresher` roadmap track (Phase 0 Foundations → Phase 4 Interview Ready), a fresher 8-week schedule variant, and the landing-hero dual-ICP split CTA — all dark behind the `fresherTrack` flag.

**Architecture:** Pure data additions to `RoadmapData.tsx` / `roadmap-schedule.ts` (new track + schedule, unit-tested for catalog integrity), one small behavioral change in `roadmap-progress.ts` so concept-only steps don't block unlock progression, and server-side flag gating: `/roadmap` and `/` server components call `canAccessFeature(userId, 'fresherTrack')` (Plan A) and pass a boolean prop down — flag off renders byte-identical UI (e2e-asserted).

**Tech Stack:** Next.js 15 App Router, React 19, Prisma, Vitest (jsdom, `@testing-library/react`), Playwright, lucide-react, framer-motion.

**Spec:** `docs/superpowers/specs/2026-07-01-flag-gated-feature-launch-design.md` (§F1, §3 Testing). Curriculum & messaging source: `docs/superpowers/plans/2026-06-30-fresher-roadmap-review.md` (Parts 3–5).

## Global Constraints

- App root is `ultimate-sd/` — all paths below are relative to it. Run unit tests with `npx vitest run <path>`, e2e with `npx playwright test <path>`, types with `npx tsc --noEmit`.
- Flag key is exactly `'fresherTrack'` (a `FeatureKey` from Plan A Task 2).
- ALL gating goes through `canAccessFeature(userId: string | null, feature: FeatureKey): Promise<boolean>` from `@/lib/feature-flags-server` (Plan A Task 5). Never re-implement flag resolution, never read `prisma.featureFlag` directly from feature code.
- Feature ships dark (`enabledPlans: []`). Flag off ⇒ **zero visual change** on `/` and `/roadmap` — asserted by e2e.
- Use ONLY these verified catalog problems (slug → id, from `src/lib/problems.ts`): `design-parking-lot` → `11`, `design-elevator-system` → `12`, `design-tinyurl` → `1`, `design-rest-api` → `40`, `design-rate-limiter` → `17`, `design-notification-system` → `22`, `design-whatsapp` → `7`. There is NO pastebin problem in the catalog — the Phase 4 "chat" capstone is `design-whatsapp` (free tier).
- Copy rules (messaging matrix, fresher plan Part 4): track label **"Fresher & Campus"**, hero split CTA text **"Starting from zero? Fresher Path →"** linking to `/roadmap?track=fresher`.
- Phase 0 is static content only: concept steps have NO `problemId`/`problemSlug`; their resources link to existing pages (`/draw`, `/practice/design-tinyurl`).
- Task order matters: Tasks 1–3 are pure data/logic and have no Plan A dependency. Tasks 4–6 require Plan A Tasks 1–5 (Prisma flag models + `feature-flags-server.ts`) to be merged.
- Do not modify the four existing tracks' data (`se`, `sse`, `mlops`, `agentic-ai`).

---

### Task 1: Fresher track data in RoadmapData

**Files:**
- Modify: `src/components/roadmap/RoadmapTypes.ts:4` (add `'fresher'` to the `RoadmapTrack` union)
- Modify: `src/components/roadmap/RoadmapData.tsx` (new track info + phases + `getRoadmapData` case)
- Modify: `src/lib/roadmap-schedule.ts:63-76` (temporary `case 'fresher'` to keep the exhaustive switch compiling; replaced in Task 3)
- Test: `src/lib/__tests__/fresher-track.test.ts` (create)

**Interfaces:**
- Consumes: existing types `RoadmapPhase`, `RoadmapStep`, `TrackInfo`, `RoadmapTrack` from `RoadmapTypes.ts`; `PROBLEMS` from `@/lib/problems`.
- Produces:
  - `RoadmapTrack = 'se' | 'sse' | 'mlops' | 'agentic-ai' | 'fresher'`
  - `export const FRESHER_TRACK_INFO: TrackInfo` (id `'fresher'`, label `'Fresher & Campus'`)
  - `getRoadmapData('fresher'): RoadmapPhase[]` — 5 phases, ids `phase-0-fresher` … `phase-4-fresher`, 7 problem steps total.
  - Exact step titles later tasks/e2e rely on: `'Design a Parking Lot'`, `'Design an Elevator'`, `'Design TinyURL'`, `'Design a REST API'`, `'Design a Rate Limiter'`, `'Design a Notification System'`, `'Design WhatsApp'`; phase title `'Phase 0: Foundations'`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/fresher-track.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getRoadmapData, FRESHER_TRACK_INFO } from '@/components/roadmap/RoadmapData';
import { PROBLEMS } from '@/lib/problems';

const fresherPhases = getRoadmapData('fresher');

describe('fresher track data integrity', () => {
  it('exposes the Fresher & Campus track info', () => {
    expect(FRESHER_TRACK_INFO.id).toBe('fresher');
    expect(FRESHER_TRACK_INFO.label).toBe('Fresher & Campus');
  });

  it('has five phases in curriculum order', () => {
    expect(fresherPhases.map((p) => p.id)).toEqual([
      'phase-0-fresher',
      'phase-1-fresher',
      'phase-2-fresher',
      'phase-3-fresher',
      'phase-4-fresher',
    ]);
  });

  it('Phase 0 is concept-only (no problems, static content)', () => {
    const phase0 = fresherPhases[0]!;
    expect(phase0.steps.length).toBeGreaterThan(0);
    for (const step of phase0.steps) {
      expect(step.problemSlug).toBeUndefined();
      expect(step.problemId).toBeUndefined();
      expect(step.resources?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('every problem step resolves to a real catalog problem with matching id', () => {
    const problemSteps = fresherPhases.flatMap((p) =>
      p.steps.filter((s) => s.problemSlug)
    );
    expect(problemSteps).toHaveLength(7);
    for (const step of problemSteps) {
      const problem = PROBLEMS.find((p) => p.slug === step.problemSlug);
      expect(problem, `missing problem for slug ${step.problemSlug}`).toBeDefined();
      expect(step.problemId).toBe(problem!.id);
    }
  });

  it('uses the canonical fresher curriculum in order', () => {
    const slugs = fresherPhases.flatMap((p) =>
      p.steps.filter((s) => s.problemSlug).map((s) => s.problemSlug)
    );
    expect(slugs).toEqual([
      'design-parking-lot',
      'design-elevator-system',
      'design-tinyurl',
      'design-rest-api',
      'design-rate-limiter',
      'design-notification-system',
      'design-whatsapp',
    ]);
  });

  it('has no duplicate step ids', () => {
    const ids = fresherPhases.flatMap((p) => p.steps.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/fresher-track.test.ts`
Expected: FAIL — `FRESHER_TRACK_INFO` is not exported from `@/components/roadmap/RoadmapData` (and `getRoadmapData('fresher')` falls back to the SE roadmap, failing the phase-id assertion).

- [ ] **Step 3: Extend the RoadmapTrack union**

In `src/components/roadmap/RoadmapTypes.ts`, change line 4:

```ts
export type RoadmapTrack = 'se' | 'sse' | 'mlops' | 'agentic-ai' | 'fresher';
```

- [ ] **Step 4: Keep roadmap-schedule.ts compiling (temporary case)**

The exhaustive `never` check in `getScheduleForTrack` (`src/lib/roadmap-schedule.ts`) now fails to compile. Add `'fresher'` to the empty group **temporarily** (Task 3 replaces this):

```ts
export function getScheduleForTrack(track: RoadmapTrack): readonly ScheduleWeek[] {
  switch (track) {
    case 'se':
      return SE_EIGHT_WEEK_SCHEDULE;
    case 'fresher': // temporary — real schedule lands in Task 3
    case 'sse':
    case 'mlops':
    case 'agentic-ai':
      return [];
    default: {
      const _exhaustive: never = track;
      return _exhaustive;
    }
  }
}
```

- [ ] **Step 5: Add the fresher track data to `src/components/roadmap/RoadmapData.tsx`**

Add `GraduationCap` and `Car` to the existing `lucide-react` import (line 2–24 already imports `Layout, Server, Globe, Shield, Database, Layers, Zap, MessageSquare, Bot, BookOpen, ..., FileText, ..., Terminal`):

```ts
import {
    Layout,
    Server,
    Globe,
    Shield,
    Database,
    Layers,
    Zap,
    MessageSquare,
    Bot,
    BookOpen,
    Cpu,
    Brain,
    FileText,
    Camera,
    PlayCircle,
    Search,
    ShieldAlert,
    Share2,
    Code,
    Activity,
    Terminal,
    GraduationCap,
    Car
} from 'lucide-react';
```

After the `TRACKS` array (do NOT add fresher to `TRACKS` — visibility is decided in Task 4), add:

```tsx
// --- Fresher & Campus Track (flag: fresherTrack) ---
// Rendered only when the fresherTrack feature flag allows (see getVisibleTracks).
export const FRESHER_TRACK_INFO: TrackInfo = {
    id: 'fresher',
    label: 'Fresher & Campus',
    description: 'Start from zero: OOP classics to your first HLD, placement-ready in 8 weeks.',
    icon: GraduationCap
};

const FRESHER_ROADMAP: RoadmapPhase[] = [
    {
        id: 'phase-0-fresher',
        title: 'Phase 0: Foundations',
        description: 'No code, no problems yet — learn what system design interviews actually expect from freshers.',
        steps: [
            {
                id: 'step-fresher-0a',
                title: 'What Is System Design?',
                description: 'HLD vs LLD, and why fresher interviews start with Parking Lot — not Netflix.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: BookOpen,
                resources: [
                    {
                        title: 'Warm up on the free diagram canvas',
                        type: 'widget',
                        url: '/draw',
                        duration: '10 min'
                    }
                ]
            },
            {
                id: 'step-fresher-0b',
                title: 'Requirements & Trade-offs',
                description: 'Functional vs non-functional requirements, CAP, and consistency vs availability with everyday examples.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: FileText,
                resources: [
                    {
                        title: 'See TinyURL simulations before you design one',
                        type: 'widget',
                        url: '/practice/design-tinyurl',
                        duration: '10 min'
                    }
                ]
            },
            {
                id: 'step-fresher-0c',
                title: 'The 4-Step Interview Framework',
                description: 'Clarify → rough scale → 5-box diagram + API → one trade-off. The lite framework fresher rounds expect.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: Layout,
                resources: [
                    {
                        title: 'Practice the 5-box diagram on the canvas',
                        type: 'widget',
                        url: '/draw',
                        duration: '15 min'
                    }
                ]
            }
        ]
    },
    {
        id: 'phase-1-fresher',
        title: 'Phase 1: OOP & LLD Classics',
        description: 'The problems service companies actually ask freshers — objects, states, and clean APIs.',
        steps: [
            {
                id: 'step-fresher-1',
                title: 'Design a Parking Lot',
                description: 'Classes, entities, and allocation strategy — the canonical fresher LLD problem.',
                problemId: '11',
                problemSlug: 'design-parking-lot',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: Car
            },
            {
                id: 'step-fresher-2',
                title: 'Design an Elevator',
                description: 'State machines and scheduling — reason about a system that moves.',
                problemId: '12',
                problemSlug: 'design-elevator-system',
                difficulty: 'Beginner',
                status: 'locked',
                icon: Layers
            }
        ]
    },
    {
        id: 'phase-2-fresher',
        title: 'Phase 2: Your First HLD',
        description: 'Cross into high-level design with the two friendliest HLD problems.',
        steps: [
            {
                id: 'step-fresher-3',
                title: 'Design TinyURL',
                description: 'Hashing, base62 encoding, and redirects — the classic first HLD interview.',
                problemId: '1',
                problemSlug: 'design-tinyurl',
                difficulty: 'Beginner',
                status: 'locked',
                icon: Globe
            },
            {
                id: 'step-fresher-4',
                title: 'Design a REST API',
                description: 'Resource modeling, HTTP methods, and status codes done right.',
                problemId: '40',
                problemSlug: 'design-rest-api',
                difficulty: 'Beginner',
                status: 'locked',
                icon: Terminal
            }
        ]
    },
    {
        id: 'phase-3-fresher',
        title: 'Phase 3: Scale Basics',
        description: 'Your first taste of scalability — protecting services and fanning out messages.',
        steps: [
            {
                id: 'step-fresher-5',
                title: 'Design a Rate Limiter',
                description: 'Token bucket and sliding windows — protect an API from abuse.',
                problemId: '17',
                problemSlug: 'design-rate-limiter',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: Shield
            },
            {
                id: 'step-fresher-6',
                title: 'Design a Notification System',
                description: 'Publish-subscribe basics for push notifications.',
                problemId: '22',
                problemSlug: 'design-notification-system',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: MessageSquare
            }
        ]
    },
    {
        id: 'phase-4-fresher',
        title: 'Phase 4: Interview Ready',
        description: 'Put it together under interview conditions.',
        steps: [
            {
                id: 'step-fresher-7a',
                title: 'Run a Timed Mock',
                description: 'Re-attempt Parking Lot or TinyURL in one 45-minute sitting: clarify, diagram, one trade-off.',
                difficulty: 'Beginner',
                status: 'unlocked',
                icon: PlayCircle,
                resources: [
                    {
                        title: 'Re-attempt Parking Lot under time pressure',
                        type: 'challenge',
                        url: '/practice/design-parking-lot',
                        duration: '45 min'
                    }
                ]
            },
            {
                id: 'step-fresher-7b',
                title: 'Design WhatsApp',
                description: 'Capstone: real-time chat basics — your bridge to the Software Engineer track.',
                problemId: '7',
                problemSlug: 'design-whatsapp',
                difficulty: 'Intermediate',
                status: 'locked',
                icon: MessageSquare
            }
        ]
    }
];
```

Then add the case to `getRoadmapData` at the bottom of the file:

```ts
export const getRoadmapData = (trackId: string): RoadmapPhase[] => {
    switch (trackId) {
        case 'se': return SE_ROADMAP;
        case 'sse': return SSE_ROADMAP;
        case 'mlops': return MLOPS_ROADMAP;
        case 'agentic-ai': return AGENTIC_ROADMAP;
        case 'fresher': return FRESHER_ROADMAP;
        default: return SE_ROADMAP;
    }
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/fresher-track.test.ts`
Expected: PASS (all 5 tests). Also run `npx tsc --noEmit` — clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/roadmap/RoadmapTypes.ts src/components/roadmap/RoadmapData.tsx src/lib/roadmap-schedule.ts src/lib/__tests__/fresher-track.test.ts
git commit -m "feat(roadmap): add fresher track data with Phase 0 foundations"
```

---

### Task 2: Concept steps must not block roadmap progression

`applyProgressToRoadmap` (`src/lib/roadmap-progress.ts`) currently treats a step without `problemSlug` as "complete only if its static status is `'completed'`" — which is never true for Phase 0 concept cards, so every step after Phase 0 would be permanently locked. Concept steps must be non-blocking: they render unlocked and pass the unlock chain through unchanged. All four existing tracks have `problemSlug` on every step, so this changes nothing for them.

**Files:**
- Modify: `src/lib/roadmap-progress.ts:52-69` (`applyProgressToRoadmap`)
- Test: `src/lib/__tests__/roadmap-progress.test.ts` (extend)

**Interfaces:**
- Consumes: `RoadmapPhase`, `RoadmapStep` types; existing `resolveStepStatus`/`isProblemStepComplete` internals.
- Produces: unchanged signature `applyProgressToRoadmap(phases: RoadmapPhase[], progressBySlug: Record<string, ProgressStatus>): RoadmapPhase[]`; new behavior: steps without `problemSlug` never flip `priorStepCompleted` to `false`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/roadmap-progress.test.ts` (inside the file, after the existing `describe` block):

```ts
const conceptPhases: RoadmapPhase[] = [
  {
    id: 'phase-0',
    title: 'Phase 0',
    description: 'Concepts only',
    steps: [
      {
        id: 'concept-1',
        title: 'What Is System Design?',
        description: 'Concept card',
        status: 'unlocked',
      },
      {
        id: 'concept-2',
        title: 'Requirements & Trade-offs',
        description: 'Concept card',
        status: 'unlocked',
      },
    ],
  },
  {
    id: 'phase-1',
    title: 'Phase 1',
    description: 'First problems',
    steps: [
      {
        id: 'step-1',
        title: 'Parking Lot',
        description: 'First problem',
        problemSlug: 'design-parking-lot',
        status: 'unlocked',
      },
      {
        id: 'step-2',
        title: 'Elevator',
        description: 'Second problem',
        problemSlug: 'design-elevator-system',
        status: 'locked',
      },
    ],
  },
];

describe('applyProgressToRoadmap with concept-only steps', () => {
  it('concept steps do not block the first problem for guests', () => {
    const result = applyProgressToRoadmap(conceptPhases, {});
    expect(result[0].steps[0].status).toBe('unlocked');
    expect(result[0].steps[1].status).toBe('unlocked');
    expect(result[1].steps[0].status).toBe('unlocked');
    expect(result[1].steps[1].status).toBe('locked');
  });

  it('problem completion still gates the following problem step', () => {
    const result = applyProgressToRoadmap(conceptPhases, {
      'design-parking-lot': 'COMPLETED',
    });
    expect(result[1].steps[0].status).toBe('completed');
    expect(result[1].steps[1].status).toBe('unlocked');
  });

  it('a concept step between problems passes the unlock chain through', () => {
    const phases: RoadmapPhase[] = [
      {
        id: 'phase-x',
        title: 'Mixed',
        description: 'Problem, concept, problem',
        steps: [
          {
            id: 'p1',
            title: 'TinyURL',
            description: 'Problem',
            problemSlug: 'design-tinyurl',
            status: 'unlocked',
          },
          {
            id: 'c1',
            title: 'Timed Mock',
            description: 'Concept card',
            status: 'unlocked',
          },
          {
            id: 'p2',
            title: 'WhatsApp',
            description: 'Problem',
            problemSlug: 'design-whatsapp',
            status: 'locked',
          },
        ],
      },
    ];
    const locked = applyProgressToRoadmap(phases, {});
    expect(locked[0].steps[2].status).toBe('locked');

    const unlocked = applyProgressToRoadmap(phases, {
      'design-tinyurl': 'COMPLETED',
    });
    expect(unlocked[0].steps[1].status).toBe('unlocked');
    expect(unlocked[0].steps[2].status).toBe('unlocked');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/roadmap-progress.test.ts`
Expected: FAIL — `result[1].steps[0].status` is `'locked'` (concept steps currently break the chain), and in the mixed case `steps[2]` stays `'locked'` after TinyURL is completed.

- [ ] **Step 3: Implement in `src/lib/roadmap-progress.ts`**

Replace the `applyProgressToRoadmap` function body:

```ts
export function applyProgressToRoadmap(
  phases: RoadmapPhase[],
  progressBySlug: Record<string, ProgressStatus>
): RoadmapPhase[] {
  let priorStepCompleted = true;

  return phases.map((phase) => ({
    ...phase,
    steps: phase.steps.map((step) => {
      const status = resolveStepStatus(step, progressBySlug, priorStepCompleted);
      // Concept-only steps (no problemSlug) are informational: they never
      // block progression, so the unlock chain passes through unchanged.
      if (step.problemSlug) {
        priorStepCompleted = isProblemStepComplete(
          { ...step, status },
          progressBySlug
        );
      }
      return { ...step, status };
    }),
  }));
}
```

- [ ] **Step 4: Run the full unit suite to verify pass + no regressions**

Run: `npx vitest run`
Expected: all PASS, including the pre-existing `roadmap-progress` tests (existing tracks are unaffected because every step there has a `problemSlug`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/roadmap-progress.ts src/lib/__tests__/roadmap-progress.test.ts
git commit -m "feat(roadmap): concept-only steps no longer block unlock progression"
```

---

### Task 3: Fresher 8-week schedule variant

**Files:**
- Modify: `src/lib/roadmap-schedule.ts` (add `FRESHER_EIGHT_WEEK_SCHEDULE`, wire `getScheduleForTrack('fresher')`, remove the Task 1 temporary case)
- Test: `src/lib/__tests__/roadmap-schedule.test.ts` (extend)

**Interfaces:**
- Consumes: `ScheduleWeek` interface (`{ week: number; title: string; focus: string; slugs: readonly string[] }`), `RoadmapTrack` (now includes `'fresher'`), `getRoadmapData` from Task 1.
- Produces: `export const FRESHER_EIGHT_WEEK_SCHEDULE: readonly ScheduleWeek[]` (8 weeks); `getScheduleForTrack('fresher')` returns it. The schedule's slugs are exactly the fresher track's 7 problem slugs (week 1 is concepts-only with `slugs: []`).

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/roadmap-schedule.test.ts` (add `FRESHER_EIGHT_WEEK_SCHEDULE` to the existing import from `'../roadmap-schedule'`, and add a new import of `getRoadmapData`):

```ts
import { getRoadmapData } from '@/components/roadmap/RoadmapData';

describe('fresher 8-week schedule', () => {
  it('defines 8 weeks for the fresher track', () => {
    const schedule = getScheduleForTrack('fresher');
    expect(schedule).toHaveLength(8);
    expect(schedule.map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('week 1 is foundations with no problems', () => {
    expect(FRESHER_EIGHT_WEEK_SCHEDULE[0]!.slugs).toEqual([]);
  });

  it('covers exactly the fresher roadmap problem slugs, in track order', () => {
    const trackSlugs = getRoadmapData('fresher').flatMap((phase) =>
      phase.steps.filter((s) => s.problemSlug).map((s) => s.problemSlug!)
    );
    const scheduleSlugs = FRESHER_EIGHT_WEEK_SCHEDULE.flatMap((w) => [...w.slugs]);
    expect(scheduleSlugs).toEqual(trackSlugs);
  });

  it('a foundations-only week with no slugs reads as upcoming', () => {
    expect(getWeekScheduleStatus(FRESHER_EIGHT_WEEK_SCHEDULE[0]!, {})).toBe('upcoming');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/roadmap-schedule.test.ts`
Expected: FAIL — `FRESHER_EIGHT_WEEK_SCHEDULE` is not exported (import error).

- [ ] **Step 3: Implement in `src/lib/roadmap-schedule.ts`**

Add after `SE_EIGHT_WEEK_SCHEDULE`:

```ts
/** 8-week study plan for the Fresher & Campus track (~5–8 hrs/week). */
export const FRESHER_EIGHT_WEEK_SCHEDULE: readonly ScheduleWeek[] = [
  {
    week: 1,
    title: 'Foundations first',
    focus: 'Concepts + canvas drills',
    slugs: [],
  },
  {
    week: 2,
    title: 'OOP warm-up',
    focus: 'Classes + allocation',
    slugs: ['design-parking-lot'],
  },
  {
    week: 3,
    title: 'State machines',
    focus: 'Scheduling logic',
    slugs: ['design-elevator-system'],
  },
  {
    week: 4,
    title: 'Your first HLD',
    focus: 'Hashing + redirects',
    slugs: ['design-tinyurl'],
  },
  {
    week: 5,
    title: 'APIs done right',
    focus: 'Resource modeling',
    slugs: ['design-rest-api'],
  },
  {
    week: 6,
    title: 'Protect the service',
    focus: 'Rate limiting',
    slugs: ['design-rate-limiter'],
  },
  {
    week: 7,
    title: 'Fan-out basics',
    focus: 'Pub/sub patterns',
    slugs: ['design-notification-system'],
  },
  {
    week: 8,
    title: 'Interview ready',
    focus: 'Timed mock + chat capstone',
    slugs: ['design-whatsapp'],
  },
] as const;
```

And replace the Task 1 temporary switch in `getScheduleForTrack` with:

```ts
export function getScheduleForTrack(track: RoadmapTrack): readonly ScheduleWeek[] {
  switch (track) {
    case 'se':
      return SE_EIGHT_WEEK_SCHEDULE;
    case 'fresher':
      return FRESHER_EIGHT_WEEK_SCHEDULE;
    case 'sse':
    case 'mlops':
    case 'agentic-ai':
      return [];
    default: {
      const _exhaustive: never = track;
      return _exhaustive;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/roadmap-schedule.test.ts`
Expected: PASS (existing SE tests plus 4 new fresher tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/roadmap-schedule.ts src/lib/__tests__/roadmap-schedule.test.ts
git commit -m "feat(roadmap): fresher 8-week schedule variant"
```

---

### Task 4: Flag-gated fresher track on the roadmap page

Requires Plan A (`@/lib/feature-flags-server`) to be merged.

**Files:**
- Modify: `src/components/roadmap/RoadmapData.tsx` (add pure `getVisibleTracks`)
- Modify: `src/app/roadmap/page.tsx` (fetch flag server-side, pass prop)
- Modify: `src/app/roadmap/RoadmapClient.tsx` (accept prop, filter tracks)
- Test: `src/lib/__tests__/fresher-track.test.ts` (extend)

**Interfaces:**
- Consumes: `canAccessFeature(userId: string | null, feature: FeatureKey): Promise<boolean>` from `@/lib/feature-flags-server` (Plan A Task 5); `auth` from `@/auth`; `FRESHER_TRACK_INFO`, `TRACKS` from Task 1.
- Produces: `export function getVisibleTracks(fresherTrackEnabled: boolean): TrackInfo[]` — `[FRESHER_TRACK_INFO, ...TRACKS]` when enabled, `TRACKS` otherwise; `RoadmapClient` prop `fresherTrackEnabled: boolean`. When the flag is off, `?track=fresher` deep links fall back to `se` exactly like any invalid track (URL is rewritten to `track=se`).

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/fresher-track.test.ts` (add `getVisibleTracks` and `TRACKS` to the existing import from `@/components/roadmap/RoadmapData`):

```ts
describe('getVisibleTracks', () => {
  it('hides the fresher track when the flag is off (zero change)', () => {
    expect(getVisibleTracks(false)).toEqual(TRACKS);
    expect(getVisibleTracks(false).some((t) => t.id === 'fresher')).toBe(false);
  });

  it('puts the fresher track first when the flag is on', () => {
    const visible = getVisibleTracks(true);
    expect(visible[0]).toEqual(FRESHER_TRACK_INFO);
    expect(visible.slice(1)).toEqual(TRACKS);
  });

  it('never mutates the base TRACKS array', () => {
    const before = [...TRACKS];
    getVisibleTracks(true);
    expect(TRACKS).toEqual(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/fresher-track.test.ts`
Expected: FAIL — `getVisibleTracks` is not exported.

- [ ] **Step 3: Implement `getVisibleTracks` in `src/components/roadmap/RoadmapData.tsx`**

Add directly below `FRESHER_TRACK_INFO`:

```ts
/**
 * Track selection respecting the fresherTrack feature flag.
 * Flag off ⇒ exactly the existing four role tracks (zero visual change).
 */
export function getVisibleTracks(fresherTrackEnabled: boolean): TrackInfo[] {
    return fresherTrackEnabled ? [FRESHER_TRACK_INFO, ...TRACKS] : [...TRACKS];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/fresher-track.test.ts` → PASS.

- [ ] **Step 5: Fetch the flag server-side in `src/app/roadmap/page.tsx`**

Replace the `RoadmapPage` component (keep `RoadmapFallback` and all existing imports; add two imports):

```tsx
import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
```

```tsx
export default async function RoadmapPage() {
  const session = await auth();
  const [progressMap, fresherTrackEnabled] = await Promise.all([
    getUserProgressMap(),
    canAccessFeature(session?.user?.id ?? null, 'fresherTrack'),
  ]);
  const progressBySlug = progressMapToSlugStatuses(progressMap);

  return (
    <Suspense fallback={<RoadmapFallback />}>
      <RoadmapClient
        progressBySlug={progressBySlug}
        fresherTrackEnabled={fresherTrackEnabled}
      />
    </Suspense>
  );
}
```

- [ ] **Step 6: Consume the prop in `src/app/roadmap/RoadmapClient.tsx`**

Change the import from `RoadmapData` and the top of the component (lines 3, 18–36):

```tsx
import { getRoadmapData, getVisibleTracks } from '@/components/roadmap/RoadmapData';
```

```tsx
interface RoadmapClientProps {
  progressBySlug: Record<string, ProgressStatus>;
  fresherTrackEnabled: boolean;
}

export function RoadmapClient({ progressBySlug, fresherTrackEnabled }: RoadmapClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trackParam = searchParams.get('track');

  const visibleTracks = useMemo(
    () => getVisibleTracks(fresherTrackEnabled),
    [fresherTrackEnabled]
  );
  const isValidTrack = visibleTracks.some((t) => t.id === trackParam);
  const selectedTrack = (isValidTrack ? trackParam : 'se') as RoadmapTrack;
```

The existing `useEffect` (redirect invalid track to `se`) and `handleTrackSelect` stay unchanged. In the JSX, replace the track-button loop source `{TRACKS.map((track) => {` with `{visibleTracks.map((track) => {` — the button body is unchanged. Remove `TRACKS` from the import (it is no longer referenced directly).

Note: with the flag off, `?track=fresher` is now an invalid track ⇒ falls back to `se` and the URL is rewritten — the dark deep-link is unreachable. `RoadmapSchedule` and `applyProgressToRoadmap` need no changes: they already key off `selectedTrack`, and Tasks 2–3 made them fresher-aware.

- [ ] **Step 7: Verify compile + no regression**

Run: `npx tsc --noEmit` → clean. Run: `npx vitest run` → all PASS.
Manual sanity (optional): `npm run dev`, open `/roadmap` — with no flag row in the DB the page must look exactly as before (four tracks).

- [ ] **Step 8: Commit**

```bash
git add src/components/roadmap/RoadmapData.tsx src/app/roadmap/page.tsx src/app/roadmap/RoadmapClient.tsx src/lib/__tests__/fresher-track.test.ts
git commit -m "feat(roadmap): flag-gated fresher track selection via canAccessFeature"
```

---

### Task 5: Landing hero dual-ICP split CTA

Requires Plan A. The senior message stays byte-identical; a "Starting from zero? Fresher Path →" link renders below the CTA buttons only when the flag allows. The `Hero` renders only for logged-out visitors (see `DashboardClient.tsx:236-242`), so the anonymous resolution of `canAccessFeature(null, 'fresherTrack')` (plan `'free'`) is the path that matters.

**Files:**
- Modify: `src/components/landing/Hero.tsx` (new optional prop + gated CTA)
- Modify: `src/components/landing/DashboardClient.tsx` (thread the prop)
- Modify: `src/app/page.tsx` (fetch flag, pass prop)
- Test: `src/components/landing/Hero.test.tsx` (create)
- Test: `src/app/page.test.tsx` (extend — mock `feature-flags-server`)

**Interfaces:**
- Consumes: `canAccessFeature` from `@/lib/feature-flags-server`.
- Produces: `HeroProps` gains `showFresherPath?: boolean`; `DashboardClientProps` gains `fresherTrackEnabled?: boolean`; `Home` passes `fresherTrackEnabled` computed server-side.

- [ ] **Step 1: Write the failing Hero component test**

Create `src/components/landing/Hero.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero fresher split CTA', () => {
  it('renders no fresher CTA by default (flag dark = zero visual change)', () => {
    render(<Hero />);
    expect(screen.queryByText(/Fresher Path/i)).toBeNull();
  });

  it('renders no fresher CTA when showFresherPath is false', () => {
    render(<Hero showFresherPath={false} />);
    expect(screen.queryByText(/Fresher Path/i)).toBeNull();
  });

  it('renders the split CTA linking to the fresher roadmap when allowed', () => {
    render(<Hero showFresherPath />);
    const cta = screen.getByRole('link', { name: /Starting from zero\? Fresher Path/i });
    expect(cta.getAttribute('href')).toBe('/roadmap?track=fresher');
  });

  it('keeps the senior CTAs regardless of the flag', () => {
    render(<Hero showFresherPath />);
    expect(screen.getByRole('link', { name: /Start Exploring/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Free Canvas/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/landing/Hero.test.tsx`
Expected: FAIL — the third test cannot find a link named "Starting from zero? Fresher Path" (TypeScript also rejects the unknown `showFresherPath` prop on build).

- [ ] **Step 3: Implement in `src/components/landing/Hero.tsx`**

Update the props interface and signature (lines 10–14):

```tsx
interface HeroProps {
    launchStats?: LaunchOfferPublicStats;
    showFresherPath?: boolean;
}

export function Hero({ launchStats, showFresherPath = false }: HeroProps) {
```

Immediately AFTER the closing `</motion.div>` of the CTA-buttons block (the one containing "Start Exploring" and "Free Canvas", ends at line 76) and BEFORE the "Launch signals" block, insert:

```tsx
                {showFresherPath && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mt-5"
                    >
                        <Link
                            href="/roadmap?track=fresher"
                            className="text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                            Starting from zero? Fresher Path →
                        </Link>
                    </motion.div>
                )}
```

Nothing else in the file changes — with `showFresherPath` falsy the rendered output is byte-identical to today.

- [ ] **Step 4: Run the Hero test to verify it passes**

Run: `npx vitest run src/components/landing/Hero.test.tsx` → PASS (4 tests).

- [ ] **Step 5: Thread the prop through `DashboardClient`**

In `src/components/landing/DashboardClient.tsx`:

1. Add to the `DashboardClientProps` interface (after the `launchUserState` member):

```ts
    fresherTrackEnabled?: boolean;
```

2. Add `fresherTrackEnabled = false` to the component's props destructuring (same list as `launchStats`, `launchUserState`).

3. Change the guest hero render (line 242):

```tsx
                <Hero
                    launchStats={launchStats?.isActive ? launchStats : undefined}
                    showFresherPath={fresherTrackEnabled}
                />
```

- [ ] **Step 6: Write the failing page wiring test**

In `src/app/page.test.tsx`, add this mock next to the other `vi.mock` calls (before the `describe`):

```tsx
vi.mock('@/lib/feature-flags-server', () => ({
  canAccessFeature: vi.fn(() => Promise.resolve(true)),
}));
```

And append inside the existing `describe('Home', ...)` block:

```tsx
  it('passes the fresherTrack flag decision to DashboardClient', async () => {
    const Component = await Home();
    renderToStaticMarkup(Component);
    expect(dashboardProps).toHaveBeenCalledWith(
      expect.objectContaining({ fresherTrackEnabled: true })
    );
  });
```

Run: `npx vitest run src/app/page.test.tsx`
Expected: FAIL — `dashboardProps` is never called with `fresherTrackEnabled` (the page does not compute it yet).

- [ ] **Step 7: Wire the flag in `src/app/page.tsx`**

Add the import:

```ts
import { canAccessFeature } from "@/lib/feature-flags-server";
```

Extend the existing parallel fetch:

```ts
  const [launchStats, launchUserState, fresherTrackEnabled] = await Promise.all([
    getLaunchOfferStats(),
    session?.user?.id
      ? getLaunchOfferUserState(session.user.id)
      : Promise.resolve(null),
    canAccessFeature(session?.user?.id ?? null, 'fresherTrack'),
  ]);
```

And pass the prop in the return:

```tsx
  return (
    <DashboardClient
      user={session?.user}
      recommendations={recommendations}
      onboardingCompleted={onboardingCompleted}
      problems={problemsWithStatus}
      launchStats={launchStats}
      launchUserState={launchUserState}
      fresherTrackEnabled={fresherTrackEnabled}
    />
  );
```

- [ ] **Step 8: Run tests to verify pass**

Run: `npx vitest run src/app/page.test.tsx src/components/landing/Hero.test.tsx` → PASS.
Run: `npx tsc --noEmit` → clean.

- [ ] **Step 9: Commit**

```bash
git add src/components/landing/Hero.tsx src/components/landing/Hero.test.tsx src/components/landing/DashboardClient.tsx src/app/page.tsx src/app/page.test.tsx
git commit -m "feat(landing): flag-gated fresher split CTA on the hero"
```

---

### Task 6: E2E — fresher track visible when granted, invisible when dark

Requires Plan A merged (Prisma `FeatureFlag` model). Adds flag seed helpers to the e2e seeding script, registers the new spec files in the Playwright config, writes the granted-path spec, and appends `fresherTrack` dark tests to `e2e/flag-gating.spec.ts` (the file Plan A Task 10 creates — if Plan A landed first, REPLACE its placeholder "no fresher track entry" test with the versions below; if the file does not exist yet, create it with exactly the content below).

**Files:**
- Modify: `scripts/seed-e2e.ts` (add `setFeatureFlagStateForE2e`)
- Modify: `playwright.config.ts` (extend `authenticated` project `testMatch`)
- Create: `e2e/fresher-track.spec.ts`
- Modify (or Create): `e2e/flag-gating.spec.ts`

**Interfaces:**
- Consumes: `seedE2eUser` from `scripts/seed-e2e.ts`; `prisma.featureFlag` (Plan A Task 1); step/phase titles from Task 1 (`'Phase 0: Foundations'`, `'Design a Parking Lot'`); hero CTA text from Task 5.
- Produces: `setFeatureFlagStateForE2e(key: string, enabledPlans: string[]): Promise<void>` — upserts the flag row; used by every later feature plan's e2e.
- Concurrency note: both spec files mutate the global `fresherTrack` flag row. Each file sets its required state in `beforeAll` and `fresher-track.spec.ts` restores dark in `afterAll`. CI runs `workers: 1` so ordering is safe; locally run these two files with `--workers=1`.

- [ ] **Step 1: Add the flag seed helper**

Append to `scripts/seed-e2e.ts`:

```ts
export async function setFeatureFlagStateForE2e(
  key: string,
  enabledPlans: string[],
) {
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabledPlans },
    create: { key, enabledPlans },
  });
}
```

- [ ] **Step 2: Register the new specs in `playwright.config.ts`**

Change the `authenticated` project's `testMatch` from:

```ts
      testMatch: /(auth|practice|roadmap)\.spec\.ts/,
```

to:

```ts
      testMatch: /(auth|practice|roadmap|fresher-track|flag-gating)\.spec\.ts/,
```

(The guest hero tests inside `fresher-track.spec.ts` reset `storageState` locally via `test.use` — no new project needed.)

- [ ] **Step 3: Write the granted-path spec**

Create `e2e/fresher-track.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { seedE2eUser, setFeatureFlagStateForE2e } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

test.describe('fresher track when the flag is enabled', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await setFeatureFlagStateForE2e('fresherTrack', [
      'free',
      'platform',
      'lifetime',
      'ai',
    ]);
  });

  test.afterAll(async () => {
    // Restore dark launch so flag-gating.spec.ts and reruns start clean.
    await setFeatureFlagStateForE2e('fresherTrack', []);
  });

  test('fresher track is selectable and shows the full curriculum', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');

    await expect(
      page.getByRole('button', { name: /Fresher & Campus/i }),
    ).toBeVisible();
    await expect(page.getByText(/Phase 0: Foundations/i)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'What Is System Design?' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Design a Parking Lot' }),
    ).toBeVisible();
    await expect(page.getByText(/Phase 4: Interview Ready/i)).toBeVisible();
  });

  test('first fresher problem is unlocked and navigable despite Phase 0 concepts', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');

    const parkingHeading = page.getByRole('heading', { name: 'Design a Parking Lot' });
    await expect(parkingHeading).toBeVisible();

    const parkingCard = parkingHeading
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]')
      .first();
    await expect(parkingCard.locator('svg.lucide-lock')).toHaveCount(0);

    await parkingCard.click(); // expand the card
    await parkingCard.getByRole('link', { name: /Solve Challenge/i }).click();
    await page.waitForURL(/\/practice\/design-parking-lot/);
  });

  test('fresher 8-week schedule renders for the track', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');
    await expect(page.getByText(/Foundations first/i)).toBeVisible();
    await expect(page.getByText(/Interview ready/i).first()).toBeVisible();
  });

  test.describe('guest hero', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('hero shows the fresher split CTA for guests when the flag is on', async ({ page }) => {
      await page.goto('/');
      const cta = page.getByRole('link', {
        name: /Starting from zero\? Fresher Path/i,
      });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href', '/roadmap?track=fresher');
      // Senior message is untouched.
      await expect(page.getByRole('link', { name: /Start Exploring/i })).toBeVisible();
    });
  });
});
```

- [ ] **Step 4: Run the granted-path spec**

Run: `npx playwright test e2e/fresher-track.spec.ts --workers=1`
Expected: PASS (4 tests). If the Prisma client lacks `featureFlag`, Plan A Task 1 has not been merged — stop and merge it first.

- [ ] **Step 5: Append the dark tests to `e2e/flag-gating.spec.ts`**

If the file exists from Plan A Task 10, replace its placeholder `'no fresher track entry on landing or roadmap'` test with the `fresherTrack dark` describe below (keep any other feature's tests). If it does not exist, create the file with exactly:

```ts
import { test, expect } from '@playwright/test';
import { seedE2eUser, setFeatureFlagStateForE2e } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

test.describe('fresherTrack dark: zero visual change', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await setFeatureFlagStateForE2e('fresherTrack', []);
  });

  test('roadmap shows only the four role tracks', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page.getByRole('button', { name: 'Software Engineer' })).toBeVisible();
    await expect(page.getByText(/Fresher & Campus/i)).toHaveCount(0);
    await expect(page.getByText(/Phase 0: Foundations/i)).toHaveCount(0);
  });

  test('deep link ?track=fresher falls back to the SE track', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');
    await page.waitForURL(/track=se/);
    await expect(page.getByText(/Phase 1: Web Fundamentals/i)).toBeVisible();
    await expect(page.getByText(/Phase 0: Foundations/i)).toHaveCount(0);
  });

  test.describe('guest landing', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('hero has no fresher CTA while dark', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText(/Fresher Path/i)).toHaveCount(0);
      // Senior hero is byte-identical: original CTAs still present.
      await expect(page.getByRole('link', { name: /Start Exploring/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Free Canvas/i })).toBeVisible();
    });
  });
});
```

- [ ] **Step 6: Run the dark suite**

Run: `npx playwright test e2e/flag-gating.spec.ts --workers=1`
Expected: PASS (3 tests).

- [ ] **Step 7: Full regression**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all unit tests PASS, types clean.

Run: `npx playwright test --workers=1`
Expected: all e2e PASS, including the pre-existing `roadmap.spec.ts` unlock tests (unchanged behavior for the SE track).

- [ ] **Step 8: Commit**

```bash
git add scripts/seed-e2e.ts playwright.config.ts e2e/fresher-track.spec.ts e2e/flag-gating.spec.ts
git commit -m "test(fresher): e2e granted visibility and dark-launch invisibility"
```

---

## Self-review notes

- **Spec coverage:** F1 track data + Phase 0 (Task 1), progress wiring via existing `roadmap-progress.ts` with the concept-step fix (Task 2), schedule variant (Task 3), flag-gated track selection (Task 4), hero dual-CTA with server-side `canAccessFeature` prop (Task 5), e2e visible-when-granted / invisible-when-dark appended to the flag-gating pattern (Task 6). "Fresher track on Free = free problems only" (plan lineup table) needs no work here: problem-level access is already enforced by `canAccessProblem`/`FREE_PROBLEM_SLUGS`; the roadmap deliberately lists non-free problems (rate limiter, notification, REST API) as upsell steps, same as the SE track today.
- **Catalog verification:** no pastebin problem exists — the Phase 4 chat capstone is `design-whatsapp` (id 7, free tier). All seven slugs/ids verified against `src/lib/problems.ts`.
- **Type consistency:** `getVisibleTracks(fresherTrackEnabled: boolean)` (Tasks 4/6), `setFeatureFlagStateForE2e(key, enabledPlans)` (Task 6), `showFresherPath` on Hero / `fresherTrackEnabled` on DashboardClient and RoadmapClient (Tasks 4–6) are used with identical names and signatures throughout.
