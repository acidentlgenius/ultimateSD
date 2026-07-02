# Plan A: Feature-Flag Engine + Lifetime Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the plan-aware feature-flag engine (DB flags + per-user overrides + `canAccessFeature()`), the admin flags UI, and the ₹1,999 Lifetime plan with one-time Razorpay checkout.

**Architecture:** Two new Prisma models (`FeatureFlag`, `FeatureFlagOverride`). A pure resolver function (unit-testable, no I/O) wrapped by a server-side `canAccessFeature()` that reads the DB and falls back to code-defined seed defaults. Lifetime becomes a fourth `PlanType` with `planExpiresAt: null` semantics. Admin panel gets a flags management tab.

**Tech Stack:** Next.js 15 App Router, Prisma/Postgres, NextAuth (`@/auth`), Razorpay, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-01-flag-gated-feature-launch-design.md`

## Global Constraints

- App root is `ultimate-sd/` — all paths below are relative to it.
- Plan types after this plan: `'free' | 'platform' | 'lifetime' | 'ai'`.
- Lifetime price: ₹1,999 (`199900` paise). Lifetime plans never expire (`planExpiresAt: null`).
- Lifetime NEVER includes platform-funded AI credits (`getInitialAiCreditsForPlan('lifetime') === 0`).
- Feature keys: `'fresherTrack' | 'interviewMode' | 'aiProbe' | 'lifetimePlan' | 'voiceInterview'`.
- All flags seed to `enabledPlans: []` (dark). Access = override(granted/denied) → else `user plan ∈ enabledPlans`.
- Every server action / API route for a flagged feature must check `canAccessFeature()` — UI checks alone are insufficient.
- Run unit tests with `npx vitest run <path>`, e2e with `npx playwright test <path>`.

---

### Task 1: Prisma models for flags and overrides

**Files:**
- Modify: `prisma/schema.prisma`
- Migration: `prisma/migrations/<generated>_feature_flags/`

**Interfaces:**
- Consumes: existing `User` model.
- Produces: `prisma.featureFlag` (`key: string` PK, `enabledPlans: string[]`, `updatedAt`), `prisma.featureFlagOverride` (`flagKey`, `userId`, `mode`, unique on `[flagKey, userId]`).

- [ ] **Step 1: Add models to `prisma/schema.prisma`**

Append at the end of the file:

```prisma
model FeatureFlag {
  key          String   @id
  enabledPlans String[] @default([])
  updatedAt    DateTime @updatedAt
}

model FeatureFlagOverride {
  id        String   @id @default(cuid())
  flagKey   String
  userId    String
  mode      String // "granted" | "denied"
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([flagKey, userId])
  @@index([userId])
}
```

And inside the existing `model User { ... }` block add the back-relation:

```prisma
  featureFlagOverrides FeatureFlagOverride[]
```

- [ ] **Step 2: Generate migration and client**

Run: `npx prisma migrate dev --name feature_flags`
Expected: migration created and applied; `npx prisma generate` runs automatically. `npx tsc --noEmit` still passes.

- [ ] **Step 3: Commit**

```bash
git add prisma/
git commit -m "feat(flags): add FeatureFlag and FeatureFlagOverride models"
```

---

### Task 2: Feature keys, seed defaults, and lifetime plan constants

**Files:**
- Modify: `src/lib/plans.ts`
- Test: `src/lib/__tests__/feature-flags.test.ts` (created here, extended in Task 4)

**Interfaces:**
- Produces: `PlanType` now includes `'lifetime'`; `FeatureKey` union; `FEATURE_KEYS: FeatureKey[]`; `FEATURE_SEED_DEFAULTS: Record<FeatureKey, PlanType[]>`; `PLAN_PRICES_INR.lifetime === 1999`, `PLAN_PRICES_PAISE.lifetime === 199900`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/feature-flags.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FEATURE_KEYS, FEATURE_SEED_DEFAULTS, PLAN_PRICES_INR, PLAN_PRICES_PAISE } from '@/lib/plans';

describe('feature seed defaults', () => {
  it('defines all five feature keys', () => {
    expect(FEATURE_KEYS).toEqual([
      'fresherTrack',
      'interviewMode',
      'aiProbe',
      'lifetimePlan',
      'voiceInterview',
    ]);
  });

  it('every seed default is empty (dark launch)', () => {
    for (const key of FEATURE_KEYS) {
      expect(FEATURE_SEED_DEFAULTS[key]).toEqual([]);
    }
  });

  it('prices lifetime at 1999 INR / 199900 paise', () => {
    expect(PLAN_PRICES_INR.lifetime).toBe(1999);
    expect(PLAN_PRICES_PAISE.lifetime).toBe(199900);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/feature-flags.test.ts`
Expected: FAIL — `FEATURE_KEYS` is not exported.

- [ ] **Step 3: Implement in `src/lib/plans.ts`**

Change the plan type line:

```ts
export type PlanType = 'free' | 'platform' | 'lifetime' | 'ai';
```

Add `lifetime: 1999` to `PLAN_PRICES_INR` and `lifetime: 199900` to `PLAN_PRICES_PAISE` (both are `Record<Exclude<PlanType, 'free'>, number>` so the compiler will demand it). Add `lifetime` entries to `PLAN_DISPLAY_NAMES` (`'Lifetime'`) and `PLAN_WELCOME_DESCRIPTIONS` (`'Lifetime access to the full problem library, solutions, and interview mode. Bring your own API key for AI features.'`).

Append:

```ts
export const FEATURE_KEYS = [
  'fresherTrack',
  'interviewMode',
  'aiProbe',
  'lifetimePlan',
  'voiceInterview',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/**
 * Intended plan sets per feature once fully launched (documentation +
 * admin-UI hint). All flags SEED as [] — dark. The DB row is live truth.
 *
 * Intended at full launch:
 *   fresherTrack   → free, platform, lifetime, ai
 *   interviewMode  → platform, lifetime, ai
 *   aiProbe        → ai (funded); BYOK path handled in feature code
 *   lifetimePlan   → free, platform, lifetime, ai (pricing page visibility)
 *   voiceInterview → ai (funded); BYOK on platform/lifetime in feature code
 */
export const FEATURE_SEED_DEFAULTS: Record<FeatureKey, PlanType[]> = {
  fresherTrack: [],
  interviewMode: [],
  aiProbe: [],
  lifetimePlan: [],
  voiceInterview: [],
};

export const FEATURE_INTENDED_PLANS: Record<FeatureKey, PlanType[]> = {
  fresherTrack: ['free', 'platform', 'lifetime', 'ai'],
  interviewMode: ['platform', 'lifetime', 'ai'],
  aiProbe: ['ai'],
  lifetimePlan: ['free', 'platform', 'lifetime', 'ai'],
  voiceInterview: ['ai'],
};
```

- [ ] **Step 4: Run test to verify it passes; fix compile fallout**

Run: `npx vitest run src/lib/__tests__/feature-flags.test.ts` → PASS.
Run: `npx tsc --noEmit`. Adding `'lifetime'` to `PlanType` will surface exhaustiveness errors (e.g., switch statements over plans). Fix each by handling `'lifetime'` explicitly — never with a default that silently treats it as free.

- [ ] **Step 5: Commit**

```bash
git add src/lib/plans.ts src/lib/__tests__/feature-flags.test.ts
git commit -m "feat(plans): add lifetime plan type and feature key registry"
```

---

### Task 3: Lifetime semantics in access.ts

**Files:**
- Modify: `src/lib/access.ts`
- Test: `src/lib/__tests__/access.test.ts` (extend existing)

**Interfaces:**
- Consumes: `PlanType` with `'lifetime'` from Task 2.
- Produces: `getEffectivePlanType`/`isPlanActive`/`hasPlatformAccess` treat lifetime as an active paid platform-level plan that never expires; `getInitialAiCreditsForPlan('lifetime') === 0`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/access.test.ts`:

```ts
describe('lifetime plan', () => {
  const lifetimeUser = { planType: 'lifetime' as const, planExpiresAt: null };

  it('is always active with no expiry', () => {
    expect(isPlanActive(lifetimeUser)).toBe(true);
  });

  it('resolves effective plan to lifetime', () => {
    expect(getEffectivePlanType(lifetimeUser)).toBe('lifetime');
  });

  it('has platform access but not the AI plan', () => {
    expect(hasPlatformAccess(lifetimeUser)).toBe(true);
    expect(hasAiPlan(lifetimeUser)).toBe(false);
  });

  it('ignores a stray expiry date on lifetime', () => {
    expect(
      isPlanActive({ planType: 'lifetime', planExpiresAt: new Date('2000-01-01') })
    ).toBe(true);
  });

  it('gets zero platform AI credits', () => {
    expect(getInitialAiCreditsForPlan('lifetime')).toBe(0);
  });
});
```

(Import any of these not already imported at the top of the test file.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/access.test.ts`
Expected: FAIL — `normalizePlanType` coerces `'lifetime'` to `'free'`.

- [ ] **Step 3: Implement in `src/lib/access.ts`**

```ts
function normalizePlanType(planType: string | null | undefined): PlanType {
  if (planType === 'platform' || planType === 'ai' || planType === 'lifetime') {
    return planType;
  }
  return 'free';
}
```

In `isPlanActive`, before the expiry check:

```ts
  if (planType === 'lifetime') {
    return true; // lifetime never expires, even if a stray expiry date exists
  }
```

In `hasPlatformAccess`:

```ts
  return plan === 'platform' || plan === 'ai' || plan === 'lifetime';
```

`getInitialAiCreditsForPlan` needs no change (default case returns 0), but confirm the switch has no `'lifetime'` credit grant.

- [ ] **Step 4: Run full unit suite to verify pass + no regressions**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/access.ts src/lib/__tests__/access.test.ts
git commit -m "feat(access): lifetime plan is non-expiring platform-level access"
```

---

### Task 4: Pure flag resolver

**Files:**
- Create: `src/lib/feature-flags.ts`
- Test: `src/lib/__tests__/feature-flags.test.ts` (extend)

**Interfaces:**
- Produces: `type OverrideMode = 'granted' | 'denied'`; `resolveFeatureAccess(input: { override: OverrideMode | null; enabledPlans: PlanType[]; plan: PlanType }): boolean`. Pure — no I/O. This is the single decision function; the server wrapper (Task 5) and nothing else implements the rule.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/feature-flags.test.ts`:

```ts
import { resolveFeatureAccess } from '@/lib/feature-flags';

describe('resolveFeatureAccess', () => {
  it('granted override wins regardless of plan and flag', () => {
    expect(
      resolveFeatureAccess({ override: 'granted', enabledPlans: [], plan: 'free' })
    ).toBe(true);
  });

  it('denied override wins even when the plan is enabled', () => {
    expect(
      resolveFeatureAccess({ override: 'denied', enabledPlans: ['ai'], plan: 'ai' })
    ).toBe(false);
  });

  it('no override: allowed only when plan is in enabledPlans', () => {
    expect(
      resolveFeatureAccess({ override: null, enabledPlans: ['platform', 'ai'], plan: 'ai' })
    ).toBe(true);
    expect(
      resolveFeatureAccess({ override: null, enabledPlans: ['platform', 'ai'], plan: 'free' })
    ).toBe(false);
  });

  it('empty enabledPlans means dark for everyone', () => {
    for (const plan of ['free', 'platform', 'lifetime', 'ai'] as const) {
      expect(resolveFeatureAccess({ override: null, enabledPlans: [], plan })).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/feature-flags.test.ts`
Expected: FAIL — module `@/lib/feature-flags` not found.

- [ ] **Step 3: Implement `src/lib/feature-flags.ts`**

```ts
import type { PlanType } from '@/lib/plans';

export type OverrideMode = 'granted' | 'denied';

export interface FeatureAccessInput {
  override: OverrideMode | null;
  enabledPlans: PlanType[];
  plan: PlanType;
}

/** The single flag-access rule: user override → plan-level launch. */
export function resolveFeatureAccess({ override, enabledPlans, plan }: FeatureAccessInput): boolean {
  if (override === 'granted') {
    return true;
  }
  if (override === 'denied') {
    return false;
  }
  return enabledPlans.includes(plan);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/feature-flags.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/feature-flags.ts src/lib/__tests__/feature-flags.test.ts
git commit -m "feat(flags): pure resolveFeatureAccess decision function"
```

---

### Task 5: Server-side canAccessFeature

**Files:**
- Create: `src/lib/feature-flags-server.ts`
- Test: `src/lib/__tests__/feature-flags-server.test.ts`

**Interfaces:**
- Consumes: `resolveFeatureAccess` (Task 4), `FEATURE_SEED_DEFAULTS`/`FeatureKey` (Task 2), `getEffectivePlanType` (Task 3), `prisma` from `@/lib/prisma`.
- Produces:
  - `canAccessFeature(userId: string | null, feature: FeatureKey): Promise<boolean>` — anonymous users resolve as plan `'free'` with no override.
  - `getFeatureFlagState(feature: FeatureKey): Promise<PlanType[]>` — DB row or seed default when missing.
  - `getAccessibleFeatures(userId: string | null): Promise<Record<FeatureKey, boolean>>` — batch helper for layouts/pages (one flags query + one overrides query).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/feature-flags-server.test.ts` (mirrors the prisma-mocking style of `src/app/actions/__tests__/admin.test.ts`):

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    featureFlag: { findUnique: vi.fn(), findMany: vi.fn() },
    featureFlagOverride: { findUnique: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { canAccessFeature, getFeatureFlagState } from '@/lib/feature-flags-server';

const mocked = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getFeatureFlagState', () => {
  it('returns the DB row when present', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'aiProbe', enabledPlans: ['ai'], updatedAt: new Date(),
    } as never);
    expect(await getFeatureFlagState('aiProbe')).toEqual(['ai']);
  });

  it('falls back to seed default (dark) when no row exists', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue(null as never);
    expect(await getFeatureFlagState('aiProbe')).toEqual([]);
  });
});

describe('canAccessFeature', () => {
  it('granted override lets a free user in while dark', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue(null as never);
    mocked.featureFlagOverride.findUnique.mockResolvedValue({
      id: '1', flagKey: 'aiProbe', userId: 'u1', mode: 'granted', createdAt: new Date(),
    } as never);
    mocked.user.findUnique.mockResolvedValue({
      planType: 'free', planExpiresAt: null,
    } as never);
    expect(await canAccessFeature('u1', 'aiProbe')).toBe(true);
  });

  it('plan launch grants access without an override', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'interviewMode', enabledPlans: ['platform', 'lifetime', 'ai'], updatedAt: new Date(),
    } as never);
    mocked.featureFlagOverride.findUnique.mockResolvedValue(null as never);
    mocked.user.findUnique.mockResolvedValue({
      planType: 'lifetime', planExpiresAt: null,
    } as never);
    expect(await canAccessFeature('u1', 'interviewMode')).toBe(true);
  });

  it('expired paid plan resolves as free', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'interviewMode', enabledPlans: ['platform'], updatedAt: new Date(),
    } as never);
    mocked.featureFlagOverride.findUnique.mockResolvedValue(null as never);
    mocked.user.findUnique.mockResolvedValue({
      planType: 'platform', planExpiresAt: new Date('2000-01-01'),
    } as never);
    expect(await canAccessFeature('u1', 'interviewMode')).toBe(false);
  });

  it('anonymous user is plan free with no override', async () => {
    mocked.featureFlag.findUnique.mockResolvedValue({
      key: 'fresherTrack', enabledPlans: ['free'], updatedAt: new Date(),
    } as never);
    expect(await canAccessFeature(null, 'fresherTrack')).toBe(true);
    expect(mocked.featureFlagOverride.findUnique).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/feature-flags-server.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/feature-flags-server.ts`**

```ts
import { prisma } from '@/lib/prisma';
import { FEATURE_SEED_DEFAULTS, FEATURE_KEYS, type FeatureKey, type PlanType } from '@/lib/plans';
import { getEffectivePlanType } from '@/lib/access';
import { resolveFeatureAccess, type OverrideMode } from '@/lib/feature-flags';

export async function getFeatureFlagState(feature: FeatureKey): Promise<PlanType[]> {
  const row = await prisma.featureFlag.findUnique({ where: { key: feature } });
  if (!row) {
    return FEATURE_SEED_DEFAULTS[feature];
  }
  return row.enabledPlans as PlanType[];
}

export async function canAccessFeature(
  userId: string | null,
  feature: FeatureKey
): Promise<boolean> {
  const enabledPlans = await getFeatureFlagState(feature);

  if (!userId) {
    return resolveFeatureAccess({ override: null, enabledPlans, plan: 'free' });
  }

  const [override, user] = await Promise.all([
    prisma.featureFlagOverride.findUnique({
      where: { flagKey_userId: { flagKey: feature, userId } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true, planExpiresAt: true },
    }),
  ]);

  const plan = user ? getEffectivePlanType(user) : 'free';
  return resolveFeatureAccess({
    override: (override?.mode as OverrideMode | undefined) ?? null,
    enabledPlans,
    plan,
  });
}

export async function getAccessibleFeatures(
  userId: string | null
): Promise<Record<FeatureKey, boolean>> {
  const [flags, overrides, user] = await Promise.all([
    prisma.featureFlag.findMany(),
    userId
      ? prisma.featureFlagOverride.findMany({ where: { userId } })
      : Promise.resolve([]),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { planType: true, planExpiresAt: true },
        })
      : Promise.resolve(null),
  ]);

  const plan = user ? getEffectivePlanType(user) : 'free';
  const flagsByKey = new Map(flags.map((f) => [f.key, f.enabledPlans as PlanType[]]));
  const overridesByKey = new Map(overrides.map((o) => [o.flagKey, o.mode as OverrideMode]));

  const result = {} as Record<FeatureKey, boolean>;
  for (const key of FEATURE_KEYS) {
    result[key] = resolveFeatureAccess({
      override: overridesByKey.get(key) ?? null,
      enabledPlans: flagsByKey.get(key) ?? FEATURE_SEED_DEFAULTS[key],
      plan,
    });
  }
  return result;
}
```

Note: the anonymous-user path in `canAccessFeature` must not query overrides (the test asserts this).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/feature-flags-server.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/feature-flags-server.ts src/lib/__tests__/feature-flags-server.test.ts
git commit -m "feat(flags): server-side canAccessFeature with seed fallback"
```

---

### Task 6: Admin server actions for flags

**Files:**
- Create: `src/app/actions/feature-flags.ts`
- Test: `src/app/actions/__tests__/feature-flags.test.ts`

**Interfaces:**
- Consumes: `requireAdmin` pattern from `src/app/actions/admin.ts` (copy the guard — it is a module-private function; do not export it from admin.ts), `prisma`, `FEATURE_KEYS`.
- Produces (all admin-only server actions):
  - `listFeatureFlags(): Promise<Array<{ key: FeatureKey; enabledPlans: PlanType[]; intendedPlans: PlanType[]; overrides: Array<{ userId: string; email: string; mode: OverrideMode }> }>>`
  - `setFeatureFlagPlans(key: FeatureKey, enabledPlans: PlanType[]): Promise<void>` — upserts the row.
  - `setFeatureFlagOverride(key: FeatureKey, email: string, mode: OverrideMode): Promise<void>` — case-insensitive email lookup (match the codebase convention from commit 48c6f72), upserts.
  - `removeFeatureFlagOverride(key: FeatureKey, email: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `src/app/actions/__tests__/feature-flags.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    featureFlag: { findMany: vi.fn(), upsert: vi.fn() },
    featureFlagOverride: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  listFeatureFlags,
  setFeatureFlagPlans,
  setFeatureFlagOverride,
} from '@/app/actions/feature-flags';

const mockedAuth = vi.mocked(auth);
const mocked = vi.mocked(prisma, true);

function signInAs(role: string) {
  mockedAuth.mockResolvedValue({ user: { id: 'admin1' } } as never);
  mocked.user.findUnique.mockResolvedValue({ id: 'admin1', role } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin guard', () => {
  it('rejects non-admin users', async () => {
    signInAs('USER');
    await expect(setFeatureFlagPlans('aiProbe', ['ai'])).rejects.toThrow();
  });
});

describe('setFeatureFlagPlans', () => {
  it('upserts the flag row with the new plan set', async () => {
    signInAs('ADMIN');
    mocked.featureFlag.upsert.mockResolvedValue({} as never);
    await setFeatureFlagPlans('aiProbe', ['ai']);
    expect(mocked.featureFlag.upsert).toHaveBeenCalledWith({
      where: { key: 'aiProbe' },
      update: { enabledPlans: ['ai'] },
      create: { key: 'aiProbe', enabledPlans: ['ai'] },
    });
  });

  it('rejects unknown feature keys', async () => {
    signInAs('ADMIN');
    await expect(setFeatureFlagPlans('notAFlag' as never, [])).rejects.toThrow('Unknown feature');
  });
});

describe('setFeatureFlagOverride', () => {
  it('resolves the user by case-insensitive email and upserts', async () => {
    signInAs('ADMIN');
    mocked.user.findFirst.mockResolvedValue({ id: 'u9' } as never);
    mocked.featureFlagOverride.upsert.mockResolvedValue({} as never);
    await setFeatureFlagOverride('aiProbe', 'Test@Example.com', 'granted');
    expect(mocked.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Test@Example.com', mode: 'insensitive' } },
      select: { id: true },
    });
    expect(mocked.featureFlagOverride.upsert).toHaveBeenCalledWith({
      where: { flagKey_userId: { flagKey: 'aiProbe', userId: 'u9' } },
      update: { mode: 'granted' },
      create: { flagKey: 'aiProbe', userId: 'u9', mode: 'granted' },
    });
  });

  it('throws when the user does not exist', async () => {
    signInAs('ADMIN');
    mocked.user.findFirst.mockResolvedValue(null as never);
    await expect(
      setFeatureFlagOverride('aiProbe', 'ghost@example.com', 'granted')
    ).rejects.toThrow('User not found');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/actions/__tests__/feature-flags.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/app/actions/feature-flags.ts`**

```ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  FEATURE_KEYS,
  FEATURE_INTENDED_PLANS,
  type FeatureKey,
  type PlanType,
} from '@/lib/plans';
import type { OverrideMode } from '@/lib/feature-flags';

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

function assertKnownFeature(key: string): asserts key is FeatureKey {
  if (!(FEATURE_KEYS as readonly string[]).includes(key)) {
    throw new Error(`Unknown feature: ${key}`);
  }
}

export async function listFeatureFlags() {
  await requireAdmin();
  const [flags, overrides] = await Promise.all([
    prisma.featureFlag.findMany(),
    prisma.featureFlagOverride.findMany({
      include: { user: { select: { email: true } } },
    }),
  ]);
  const flagsByKey = new Map(flags.map((f) => [f.key, f.enabledPlans as PlanType[]]));
  return FEATURE_KEYS.map((key) => ({
    key,
    enabledPlans: flagsByKey.get(key) ?? [],
    intendedPlans: FEATURE_INTENDED_PLANS[key],
    overrides: overrides
      .filter((o) => o.flagKey === key)
      .map((o) => ({
        userId: o.userId,
        email: o.user.email,
        mode: o.mode as OverrideMode,
      })),
  }));
}

export async function setFeatureFlagPlans(key: FeatureKey, enabledPlans: PlanType[]) {
  await requireAdmin();
  assertKnownFeature(key);
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabledPlans },
    create: { key, enabledPlans },
  });
  revalidatePath('/admin');
}

export async function setFeatureFlagOverride(
  key: FeatureKey,
  email: string,
  mode: OverrideMode
) {
  await requireAdmin();
  assertKnownFeature(key);
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!user) {
    throw new Error('User not found');
  }
  await prisma.featureFlagOverride.upsert({
    where: { flagKey_userId: { flagKey: key, userId: user.id } },
    update: { mode },
    create: { flagKey: key, userId: user.id, mode },
  });
  revalidatePath('/admin');
}

export async function removeFeatureFlagOverride(key: FeatureKey, email: string) {
  await requireAdmin();
  assertKnownFeature(key);
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!user) {
    return;
  }
  await prisma.featureFlagOverride.deleteMany({
    where: { flagKey: key, userId: user.id },
  });
  revalidatePath('/admin');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/actions/__tests__/feature-flags.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/feature-flags.ts src/app/actions/__tests__/feature-flags.test.ts
git commit -m "feat(flags): admin server actions for plan launches and user overrides"
```

---

### Task 7: Admin flags UI panel

**Files:**
- Create: `src/app/admin/FeatureFlagsPanel.tsx`
- Modify: `src/app/admin/AdminDashboard.tsx` (add the panel — follow how `LaunchOfferPanel` is embedded)
- Test: `e2e/admin-flags.spec.ts`

**Interfaces:**
- Consumes: all four actions from Task 6.
- Produces: an admin-only UI section titled "Feature Flags" with, per flag: plan checkboxes (Free/Platform/Lifetime/AI Pro), a highlighted hint showing `intendedPlans`, a confirmation dialog when saving a set that differs from `intendedPlans`, and an overrides block (email input + Grant/Deny buttons + list with remove).

- [ ] **Step 1: Implement the panel**

`src/app/admin/FeatureFlagsPanel.tsx` (client component; match Tailwind/styling conventions of `LaunchOfferPanel.tsx`):

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  listFeatureFlags,
  setFeatureFlagPlans,
  setFeatureFlagOverride,
  removeFeatureFlagOverride,
} from '@/app/actions/feature-flags';
import type { FeatureKey, PlanType } from '@/lib/plans';

const ALL_PLANS: { value: PlanType; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'platform', label: 'Platform' },
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'ai', label: 'AI Pro' },
];

type FlagRow = Awaited<ReturnType<typeof listFeatureFlags>>[number];

export default function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () => listFeatureFlags().then(setFlags).catch((e) => setError(String(e)));

  useEffect(() => {
    refresh();
  }, []);

  const togglePlan = (flag: FlagRow, plan: PlanType) => {
    const next = flag.enabledPlans.includes(plan)
      ? flag.enabledPlans.filter((p) => p !== plan)
      : [...flag.enabledPlans, plan];
    const deviates =
      next.some((p) => !flag.intendedPlans.includes(p));
    if (
      deviates &&
      !window.confirm(
        `"${flag.key}" is intended for: ${flag.intendedPlans.join(', ') || 'none'}. Enable for ${next.join(', ')} anyway?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await setFeatureFlagPlans(flag.key, next);
      await refresh();
    });
  };

  const applyOverride = (key: FeatureKey, mode: 'granted' | 'denied') => {
    const email = emailInputs[key]?.trim();
    if (!email) return;
    startTransition(async () => {
      try {
        await setFeatureFlagOverride(key, email, mode);
        setEmailInputs((s) => ({ ...s, [key]: '' }));
        setError(null);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <section aria-label="Feature Flags" className="space-y-6">
      <h2 className="text-xl font-semibold">Feature Flags</h2>
      {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
      {flags.map((flag) => (
        <div key={flag.key} className="rounded-lg border border-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono font-medium">{flag.key}</h3>
            <span className="text-xs text-slate-400">
              Intended: {flag.intendedPlans.join(', ') || 'none'}
            </span>
          </div>
          <div className="flex gap-4">
            {ALL_PLANS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  disabled={isPending}
                  checked={flag.enabledPlans.includes(value)}
                  onChange={() => togglePlan(flag, value)}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="email"
              placeholder="user@example.com"
              value={emailInputs[flag.key] ?? ''}
              onChange={(e) =>
                setEmailInputs((s) => ({ ...s, [flag.key]: e.target.value }))
              }
              className="rounded border border-slate-600 bg-transparent px-2 py-1 text-sm"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => applyOverride(flag.key, 'granted')}
              className="rounded bg-emerald-700 px-2 py-1 text-sm"
            >
              Grant
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => applyOverride(flag.key, 'denied')}
              className="rounded bg-red-800 px-2 py-1 text-sm"
            >
              Deny
            </button>
          </div>
          {flag.overrides.length > 0 && (
            <ul className="text-sm space-y-1">
              {flag.overrides.map((o) => (
                <li key={o.userId} className="flex items-center gap-2">
                  <span>{o.email}</span>
                  <span className={o.mode === 'granted' ? 'text-emerald-400' : 'text-red-400'}>
                    {o.mode}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove override for ${o.email}`}
                    onClick={() =>
                      startTransition(async () => {
                        await removeFeatureFlagOverride(flag.key, o.email);
                        await refresh();
                      })
                    }
                    className="text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
```

In `AdminDashboard.tsx`, import and render `<FeatureFlagsPanel />` alongside `LaunchOfferPanel` (same section/tab structure the file already uses).

- [ ] **Step 2: Verify it compiles and renders**

Run: `npx tsc --noEmit` → clean. Then `npm run dev`, open `/admin` as an admin user, confirm the Feature Flags section lists all five flags with unchecked boxes.

- [ ] **Step 3: Write the e2e spec**

Create `e2e/admin-flags.spec.ts` (reuse auth helpers from `e2e/auth.setup.ts` / `e2e/helpers` — follow how `smoke.spec.ts` obtains an authenticated admin context):

```ts
import { test, expect } from '@playwright/test';

test.describe('admin feature flags', () => {
  test('admin can launch a flag to a plan and grant a user override', async ({ page }) => {
    await page.goto('/admin');
    const section = page.getByRole('region', { name: 'Feature Flags' });
    await expect(section.getByText('fresherTrack')).toBeVisible();

    const flagCard = section.locator('div', { hasText: 'fresherTrack' }).first();
    page.on('dialog', (d) => d.accept());
    await flagCard.getByLabel('Free').check();
    await expect(flagCard.getByLabel('Free')).toBeChecked();

    await flagCard.getByPlaceholder('user@example.com').fill('e2e-test-user@example.com');
    await flagCard.getByRole('button', { name: 'Grant' }).click();
    await expect(flagCard.getByText('e2e-test-user@example.com')).toBeVisible();
    await expect(flagCard.getByText('granted')).toBeVisible();
  });
});
```

(Adjust the admin auth setup to whatever `e2e/global-setup.ts` provides; the e2e DB must contain the admin user and `e2e-test-user@example.com` — add the latter to the global setup seed if missing.)

- [ ] **Step 4: Run the e2e spec**

Run: `npx playwright test e2e/admin-flags.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/FeatureFlagsPanel.tsx src/app/admin/AdminDashboard.tsx e2e/admin-flags.spec.ts e2e/global-setup.ts
git commit -m "feat(admin): feature flags panel with plan launches and user overrides"
```

---

### Task 8: Lifetime plan purchase flow

**Files:**
- Modify: `src/lib/user-llm.ts:303-318` (`activateUserPlan`)
- Modify: `src/app/api/orders/route.ts` (accept `'lifetime'`)
- Modify: `src/app/api/orders/verify/route.ts` (accept `'lifetime'`)
- Modify: `src/app/api/webhooks/razorpay/route.ts` (accept `'lifetime'`)
- Test: `src/lib/__tests__/user-llm-lifetime.test.ts`

**Interfaces:**
- Consumes: `PLAN_PRICES_PAISE.lifetime` (Task 2), lifetime semantics in `access.ts` (Task 3).
- Produces: `activateUserPlan(userId, planType: 'platform' | 'ai' | 'lifetime')` — for `'lifetime'` sets `planExpiresAt: null`, `aiCredits: 0`, `aiCreditsResetAt: null`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/user-llm-lifetime.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { update: vi.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { activateUserPlan } from '@/lib/user-llm';

const mocked = vi.mocked(prisma, true);

beforeEach(() => vi.clearAllMocks());

describe('activateUserPlan lifetime', () => {
  it('sets a never-expiring plan with zero platform credits', async () => {
    mocked.user.update.mockResolvedValue({} as never);
    await activateUserPlan('u1', 'lifetime');
    const data = mocked.user.update.mock.calls[0][0].data;
    expect(data.planType).toBe('lifetime');
    expect(data.planExpiresAt).toBeNull();
    expect(data.aiCredits).toBe(0);
    expect(data.aiCreditsResetAt).toBeNull();
  });

  it('keeps monthly expiry for platform', async () => {
    mocked.user.update.mockResolvedValue({} as never);
    await activateUserPlan('u1', 'platform');
    const data = mocked.user.update.mock.calls[0][0].data;
    expect(data.planExpiresAt).toBeInstanceOf(Date);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/user-llm-lifetime.test.ts`
Expected: FAIL — TypeScript rejects `'lifetime'` argument.

- [ ] **Step 3: Implement**

In `src/lib/user-llm.ts`, replace `activateUserPlan`:

```ts
export async function activateUserPlan(
  userId: string,
  planType: 'platform' | 'ai' | 'lifetime'
): Promise<void> {
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      planType,
      planActivatedAt: now,
      planExpiresAt:
        planType === 'lifetime'
          ? null
          : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      aiCredits: getInitialAiCreditsForPlan(planType),
      aiCreditsResetAt: planType === 'ai' ? getNextAiCreditsResetDate(now) : null,
    },
  });
}
```

In `src/app/api/orders/route.ts`, widen the validation and gate lifetime behind its flag:

```ts
import { canAccessFeature } from '@/lib/feature-flags-server';
// ...
    if (planType !== 'platform' && planType !== 'ai' && planType !== 'lifetime') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }
    if (planType === 'lifetime' && !(await canAccessFeature(session.user.id, 'lifetimePlan'))) {
      return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }
```

Apply the same three-way validation in `src/app/api/orders/verify/route.ts` and in the webhook's notes check in `src/app/api/webhooks/razorpay/route.ts` (`planType !== 'platform' && planType !== 'ai' && planType !== 'lifetime'`). The verify route's success message: use `PLAN_DISPLAY_NAMES[planType]` instead of the current ternary.

- [ ] **Step 4: Run tests**

Run: `npx vitest run` → all PASS. `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/user-llm.ts src/app/api/orders/ src/app/api/webhooks/ src/lib/__tests__/user-llm-lifetime.test.ts
git commit -m "feat(payments): lifetime plan one-time purchase flow, flag-gated"
```

---

### Task 9: Pricing page lifetime card (flag-gated)

**Files:**
- Modify: the pricing UI — locate with `grep -rn "₹299\|PLAN_PRICES_INR" src/components src/app --include="*.tsx" -l` (expected: a pricing section component; wire from its server parent)
- Test: `e2e/lifetime-pricing.spec.ts`

**Interfaces:**
- Consumes: `canAccessFeature(userId, 'lifetimePlan')` from Task 5; existing Razorpay checkout invocation used by the Platform/AI cards.
- Produces: a "Lifetime — ₹1,999 one-time" card rendered only when the flag allows; card triggers the same checkout flow with `planType: 'lifetime'`.

- [ ] **Step 1: Wire the flag server-side**

In the pricing section's server component (parent page), fetch `const showLifetime = await canAccessFeature(session?.user?.id ?? null, 'lifetimePlan')` and pass it as a prop. In the pricing component, render the lifetime card only when `showLifetime` is true, listing: full 86-problem library, expert solutions, interview mode, BYOK AI ("bring your own API key — platform AI credits not included"). CTA calls the existing order-creation fetch with `planType: 'lifetime'`.

- [ ] **Step 2: Write the e2e spec**

Create `e2e/lifetime-pricing.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('lifetime card is hidden while the flag is dark', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('₹1,999')).toHaveCount(0);
});

test('lifetime order API returns 403 while dark', async ({ request }) => {
  const res = await request.post('/api/orders', { data: { planType: 'lifetime' } });
  expect([401, 403]).toContain(res.status());
});
```

(The signed-in 403 variant belongs to the gating suite in Task 10; here the unauthenticated call must not 200.)

- [ ] **Step 3: Run the spec**

Run: `npx playwright test e2e/lifetime-pricing.spec.ts` → PASS

- [ ] **Step 4: Commit**

```bash
git add -A src/ e2e/lifetime-pricing.spec.ts
git commit -m "feat(pricing): flag-gated lifetime plan card"
```

---

### Task 10: Flag-gating security e2e suite + seed script

**Files:**
- Create: `e2e/flag-gating.spec.ts`
- Create: `prisma/seed-flags.ts` (idempotent seed: upsert all five flags with `enabledPlans: []`)
- Modify: `package.json` (script `"seed:flags": "tsx prisma/seed-flags.ts"`)

**Interfaces:**
- Consumes: everything above.
- Produces: CI-runnable proof that dark features are unreachable.

- [ ] **Step 1: Write the seed script**

`prisma/seed-flags.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import { FEATURE_KEYS, FEATURE_SEED_DEFAULTS } from '../src/lib/plans';

const prisma = new PrismaClient();

async function main() {
  for (const key of FEATURE_KEYS) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: {}, // never clobber a live launch
      create: { key, enabledPlans: FEATURE_SEED_DEFAULTS[key] },
    });
  }
  console.log('Seeded feature flags (existing rows untouched).');
}

main().finally(() => prisma.$disconnect());
```

Run: `npx tsx prisma/seed-flags.ts` → prints the seeded message; verify rows via `npx prisma studio` or a quick query.

- [ ] **Step 2: Write the gating spec**

Create `e2e/flag-gating.spec.ts` — as a signed-in free-tier user (reuse the standard authenticated context from `e2e/global-setup.ts`):

```ts
import { test, expect } from '@playwright/test';

test.describe('dark features are invisible and unreachable', () => {
  test('no fresher track entry on landing or roadmap', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/fresher path/i)).toHaveCount(0);
    await page.goto('/roadmap');
    await expect(page.getByText(/fresher/i)).toHaveCount(0);
  });

  test('lifetime order API rejects a signed-in user while dark', async ({ request }) => {
    const res = await request.post('/api/orders', { data: { planType: 'lifetime' } });
    expect(res.status()).toBe(403);
  });
});
```

Plans B–D each append their own dark-gating tests for their APIs to this file (interview session start, probe chat, voice session) — the file establishes the pattern.

- [ ] **Step 3: Run the suite**

Run: `npx playwright test e2e/flag-gating.spec.ts` → PASS

- [ ] **Step 4: Full regression + commit**

Run: `npx vitest run && npx playwright test` → all PASS.

```bash
git add e2e/flag-gating.spec.ts prisma/seed-flags.ts package.json
git commit -m "test(flags): dark-launch gating suite and idempotent flag seed"
```
