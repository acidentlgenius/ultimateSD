# Launch Offer Unified Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the launch offer so users only sign in and claim a Platform seat (driving signups); all Platform claimants are automatically eligible for the 5 AI-plan lucky draw, which the admin runs from the admin panel — no separate giveaway entry flow.

**Architecture:** Reuse `LaunchOfferRedemption` as the single source of truth. Platform claim (`kind: PLATFORM_LAUNCH`) is the only user action. The AI draw pool becomes all `PLATFORM_LAUNCH` redemptions whose users still have a Platform plan (not yet upgraded). When an admin draws winners, upgrade those users to the AI plan and flip their redemption `kind` to `AI_GIVEAWAY`. Fix the 50-slot cap to count both kinds so upgraded winners do not free a slot. Deprecate `LaunchOfferEntry` and remove all user-facing giveaway-entry UI/actions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL, Vitest 4

**App root:** `ultimate-sd/`

---

## File Map

| File | Responsibility |
|------|----------------|
| `ultimate-sd/src/lib/launch-offer.ts` | Rename `aiEntries` → `aiEligible`; remove `hasEnteredGiveaway` from user state type |
| `ultimate-sd/src/lib/launch-offer-grant.ts` | Fix slot cap query; draw from platform claimants; remove `enterAiGiveaway`; add `getLaunchOfferPlatformClaimants` |
| `ultimate-sd/src/lib/__tests__/launch-offer.test.ts` | Update stats tests for `aiEligible` |
| `ultimate-sd/src/lib/__tests__/launch-offer-grant.test.ts` | Add draw-from-platform tests; remove entry tests if any |
| `ultimate-sd/src/app/actions/launch-offer.ts` | Remove `enterAiGiveawayAction` |
| `ultimate-sd/src/components/landing/LaunchOfferSection.tsx` | Single CTA UX; informational AI lucky-draw card |
| `ultimate-sd/src/components/landing/LaunchOfferBanner.tsx` | Copy: claim Platform, auto-entered for AI draw |
| `ultimate-sd/src/app/admin/LaunchOfferPanel.tsx` | Draw from eligible claimants; show claimant list |
| `ultimate-sd/src/app/admin/page.tsx` | Rename stat label `Giveaway Entries` → `AI draw eligible` |
| `ultimate-sd/prisma/schema.prisma` | *(no schema change required)* — `LaunchOfferEntry` kept but unused |

## Scope

**In scope**
- One user path: sign in → claim Platform seat
- Platform claimants automatically eligible for AI lucky draw
- Admin draw picks from platform claimants (not `LaunchOfferEntry`)
- Slot cap counts both `PLATFORM_LAUNCH` and `AI_GIVEAWAY` self-serve redemptions
- Updated marketing copy across banner, pricing section, launch offer section

**Out of scope**
- Dropping `LaunchOfferEntry` table (can delete in a later migration once confirmed unused)
- Drawing based on `User.createdAt` alone (account signups without claiming are not in the pool)
- Email announcing "you're entered in the AI draw" (optional follow-up)
- Migrating legacy `LaunchOfferEntry` rows into eligibility (see **Legacy data** below)

## Legacy data

Users who previously used **Enter AI giveaway** without claiming Platform will **not** be in the new draw pool. Options (pick one at implementation time):

1. **Recommended:** Accept the small edge case; those users can still claim Platform if slots remain.
2. **One-time merge:** Before deploy, run a script that deletes orphan `LaunchOfferEntry` rows and email those users to claim Platform.

Document the chosen approach in the PR description.

---

## Task 1: Update launch offer types and stats

**Files:**
- Modify: `ultimate-sd/src/lib/launch-offer.ts`
- Modify: `ultimate-sd/src/lib/__tests__/launch-offer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// ultimate-sd/src/lib/__tests__/launch-offer.test.ts — add to describe('buildLaunchOfferStats')
it('exposes aiEligible instead of aiEntries', () => {
  const stats = buildLaunchOfferStats(12, 2, 35);
  expect(stats.aiEligible).toBe(35);
  expect(stats).not.toHaveProperty('aiEntries');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/launch-offer.test.ts`
Expected: FAIL — `aiEligible` is undefined

- [ ] **Step 3: Update types and builder**

In `ultimate-sd/src/lib/launch-offer.ts`:

```typescript
export type LaunchOfferPublicStats = {
  platformClaimed: number;
  platformRemaining: number;
  aiWinners: number;
  aiEligible: number; // platform claimants not yet upgraded to AI
  isActive: boolean;
};

export type LaunchOfferUserState = {
  hasRedeemed: boolean;
  redemptionKind: 'PLATFORM_LAUNCH' | 'AI_GIVEAWAY' | null;
  isEligibleForAiDraw: boolean; // claimed platform, not yet AI winner
};

export function buildLaunchOfferStats(
  platformClaimed: number,
  aiWinners: number,
  aiEligible: number,
  now = new Date()
): LaunchOfferPublicStats {
  return {
    platformClaimed,
    platformRemaining: Math.max(0, LAUNCH_PLATFORM_SLOTS - platformClaimed),
    aiWinners,
    aiEligible,
    isActive: isLaunchOfferActive(now),
  };
}
```

Update the existing `buildLaunchOfferStats` test assertions to use `aiEligible`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/launch-offer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd ultimate-sd
git add src/lib/launch-offer.ts src/lib/__tests__/launch-offer.test.ts
git commit -m "refactor: rename launch offer aiEntries to aiEligible"
```

---

## Task 2: Fix slot cap and stats in grant layer

**Files:**
- Modify: `ultimate-sd/src/lib/launch-offer-grant.ts`
- Modify: `ultimate-sd/src/lib/__tests__/launch-offer-grant.test.ts`

- [ ] **Step 1: Write the failing test for slot cap**

```typescript
// ultimate-sd/src/lib/__tests__/launch-offer-grant.test.ts
import { drawAiGiveawayWinners } from '../launch-offer-grant';

describe('drawAiGiveawayWinners', () => {
  // ... extend prisma mock with findMany, $transaction array form ...

  it('draws from PLATFORM_LAUNCH claimants and upgrades them to AI', async () => {
    mockCount.mockResolvedValue(0); // existing AI winners
    mockFindMany.mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ]);
    // mock user findUnique for email, mock $transaction for upgrade
    const result = await drawAiGiveawayWinners('admin-1', 1);
    expect(result).toEqual(
      expect.objectContaining({ success: true, winnerCount: 1 })
    );
    // assert redemption update kind → AI_GIVEAWAY, user planType → ai
  });

  it('returns no_eligible when no platform claimants remain', async () => {
    mockCount.mockResolvedValue(0);
    mockFindMany.mockResolvedValue([]);
    const result = await drawAiGiveawayWinners('admin-1');
    expect(result).toEqual({ error: 'no_eligible' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/launch-offer-grant.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement grant-layer changes**

Key changes in `ultimate-sd/src/lib/launch-offer-grant.ts`:

**Helper — count slots used (both kinds):**

```typescript
async function countPlatformSlotsUsed(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma
): Promise<number> {
  return tx.launchOfferRedemption.count({
    where: { kind: { in: ['PLATFORM_LAUNCH', 'AI_GIVEAWAY'] } },
  });
}
```

Use `countPlatformSlotsUsed` in `claimPlatformLaunchOffer` and `grantAdminPlatformPlan` instead of counting only `PLATFORM_LAUNCH`.

**Stats:**

```typescript
export async function getLaunchOfferStats(): Promise<LaunchOfferPublicStats> {
  const [platformClaimed, aiWinners, aiEligible] = await Promise.all([
    prisma.launchOfferRedemption.count({
      where: { kind: { in: ['PLATFORM_LAUNCH', 'AI_GIVEAWAY'] } },
    }),
    prisma.launchOfferRedemption.count({ where: { kind: 'AI_GIVEAWAY' } }),
    prisma.launchOfferRedemption.count({ where: { kind: 'PLATFORM_LAUNCH' } }),
  ]);
  return buildLaunchOfferStats(platformClaimed, aiWinners, aiEligible);
}
```

**User state:**

```typescript
export async function getLaunchOfferUserState(userId: string): Promise<LaunchOfferUserState> {
  const redemption = await prisma.launchOfferRedemption.findUnique({ where: { userId } });
  return {
    hasRedeemed: Boolean(redemption),
    redemptionKind: redemption?.kind ?? null,
    isEligibleForAiDraw: redemption?.kind === 'PLATFORM_LAUNCH',
  };
}
```

**Draw — replace entry pool with platform claimants:**

```typescript
export type DrawWinnersResult =
  | { success: true; winnerCount: number; emailFailures: number }
  | { error: 'giveaway_full' | 'no_eligible' };

export async function drawAiGiveawayWinners(
  adminId: string,
  count = LAUNCH_AI_WINNER_SLOTS
): Promise<DrawWinnersResult> {
  const existingWinners = await prisma.launchOfferRedemption.count({
    where: { kind: 'AI_GIVEAWAY' },
  });
  const slotsLeft = LAUNCH_AI_WINNER_SLOTS - existingWinners;
  if (slotsLeft <= 0) return { error: 'giveaway_full' };

  const eligible = await prisma.launchOfferRedemption.findMany({
    where: { kind: 'PLATFORM_LAUNCH' },
    select: { userId: true, id: true },
  });
  if (eligible.length === 0) return { error: 'no_eligible' };

  const pickCount = Math.min(count, slotsLeft, eligible.length);
  const winners = shuffleInPlace([...eligible]).slice(0, pickCount);

  let emailFailures = 0;
  for (const { userId, id: redemptionId } of winners) {
    const now = new Date();
    const expiresAt = getLaunchOfferExpiry(now);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          planType: 'ai',
          planActivatedAt: now,
          planExpiresAt: expiresAt,
          aiCredits: getInitialAiCreditsForPlan('ai'),
          aiCreditsResetAt: getNextAiCreditsResetDate(now),
        },
      }),
      prisma.launchOfferRedemption.update({
        where: { id: redemptionId },
        data: { kind: 'AI_GIVEAWAY', expiresAt, grantedBy: adminId },
      }),
    ]);

    // ... sendPlanWelcomeEmail (planType: 'ai') — same as today ...
  }

  return { success: true, winnerCount: pickCount, emailFailures };
}
```

**Remove** `enterAiGiveaway` and `EnterGiveawayResult` entirely.

**Add** admin helper to list claimants:

```typescript
export type LaunchOfferClaimantRow = {
  userId: string;
  email: string;
  name: string | null;
  claimedAt: Date;
  kind: 'PLATFORM_LAUNCH' | 'AI_GIVEAWAY';
};

export async function getLaunchOfferPlatformClaimants(): Promise<LaunchOfferClaimantRow[]> {
  return prisma.launchOfferRedemption.findMany({
    where: { kind: { in: ['PLATFORM_LAUNCH', 'AI_GIVEAWAY'] } },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { grantedAt: 'asc' },
  }).then((rows) =>
    rows.map((r) => ({
      userId: r.userId,
      email: r.user.email,
      name: r.user.name,
      claimedAt: r.grantedAt,
      kind: r.kind,
    }))
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/launch-offer-grant.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd ultimate-sd
git add src/lib/launch-offer-grant.ts src/lib/__tests__/launch-offer-grant.test.ts
git commit -m "feat: draw AI winners from platform launch claimants"
```

---

## Task 3: Remove giveaway entry server action

**Files:**
- Modify: `ultimate-sd/src/app/actions/launch-offer.ts`

- [ ] **Step 1: Remove `enterAiGiveaway` import and `enterAiGiveawayAction`**

Delete the entire `enterAiGiveawayAction` function and its import. Export `getLaunchOfferPlatformClaimants` from grant layer via admin page data loader (Task 5).

- [ ] **Step 2: Verify no broken imports**

Run: `cd ultimate-sd && pnpm lint`
Expected: PASS (or only errors in UI files fixed in Task 4)

- [ ] **Step 3: Commit**

```bash
cd ultimate-sd
git add src/app/actions/launch-offer.ts
git commit -m "refactor: remove separate AI giveaway entry action"
```

---

## Task 4: Simplify user-facing launch offer UI

**Files:**
- Modify: `ultimate-sd/src/components/landing/LaunchOfferSection.tsx`
- Modify: `ultimate-sd/src/components/landing/LaunchOfferBanner.tsx`
- Modify: `ultimate-sd/src/app/pricing/PricingClient.tsx` (if it references giveaway copy)

- [ ] **Step 1: Update `LaunchOfferBanner` copy**

Replace sold-out message:

```tsx
{soldOut ? (
  <>All Platform slots claimed — {LAUNCH_AI_WINNER_SLOTS} AI plans will be drawn from claimants</>
) : (
  <>
    <strong className="text-foreground">{stats.platformRemaining}</strong> of {LAUNCH_PLATFORM_SLOTS} free
    Platform plans left · claim to enter AI lucky draw
  </>
)}
```

- [ ] **Step 2: Rework `LaunchOfferSection`**

Changes:
- Remove `enterAiGiveawayAction` import and `handleEnter`
- Remove `hasEntered` / `action === 'enter'` state
- Update hero copy: *"Sign in and claim your free Platform plan. Every claimant is automatically entered into a lucky draw for {LAUNCH_AI_WINNER_SLOTS} AI plans."*
- **Platform card:** keep claim CTA (unchanged logic)
- **AI card:** convert to informational only — no button to enter
  - Show `{stats.aiEligible} claimants eligible` and `{stats.aiWinners} / {LAUNCH_AI_WINNER_SLOTS} winners selected`
  - If `userState?.isEligibleForAiDraw`: show badge *"You're in the AI lucky draw ✓"*
  - If `userState?.redemptionKind === 'AI_GIVEAWAY'`: show *"You won the AI lucky draw!"*
  - If not logged in / not claimed: *"Claim Platform above to be entered automatically"*

- [ ] **Step 3: Manual smoke check**

Run: `cd ultimate-sd && pnpm dev`
Visit `/pricing#launch-offer` — confirm single claim CTA, no "Enter giveaway" button.

- [ ] **Step 4: Commit**

```bash
cd ultimate-sd
git add src/components/landing/LaunchOfferSection.tsx src/components/landing/LaunchOfferBanner.tsx
git commit -m "feat: unify launch offer around platform claim + auto AI draw eligibility"
```

---

## Task 5: Update admin panel

**Files:**
- Modify: `ultimate-sd/src/app/admin/LaunchOfferPanel.tsx`
- Modify: `ultimate-sd/src/app/admin/page.tsx`
- Modify: `ultimate-sd/src/app/admin/AdminDashboard.tsx` (if props change)

- [ ] **Step 1: Update stats labels**

In `LaunchOfferPanel` and `admin/page.tsx`:
- `Giveaway entries` → `AI draw eligible`
- Use `stats.aiEligible` instead of `stats.aiEntries`

- [ ] **Step 2: Update draw confirmation copy**

```typescript
confirm(
  `Draw up to ${LAUNCH_AI_WINNER_SLOTS - stats.aiWinners} AI winner(s) from ${stats.aiEligible} eligible Platform claimants?`
)
```

- [ ] **Step 3: Update `canDraw` and error messages**

```typescript
const canDraw =
  stats.aiWinners < LAUNCH_AI_WINNER_SLOTS && stats.aiEligible > 0;

// error map:
no_eligible: 'No eligible Platform claimants to draw from.',
```

- [ ] **Step 4: Add claimants table (optional but recommended)**

Below the redemptions table, add a section **"Platform claimants (AI draw pool)"** listing `getLaunchOfferPlatformClaimants()` with columns: User, Claimed at, Status (`Eligible` / `AI winner`).

Wire data in `ultimate-sd/src/app/admin/page.tsx`:

```typescript
import { getLaunchOfferPlatformClaimants } from '@/lib/launch-offer-grant';

const [launchStats, launchRedemptions, launchClaimants] = await Promise.all([
  getLaunchOfferStats(),
  getLaunchOfferRedemptions(),
  getLaunchOfferPlatformClaimants(),
]);
```

Pass `launchClaimants` to `AdminDashboard` → `LaunchOfferPanel`.

- [ ] **Step 5: Commit**

```bash
cd ultimate-sd
git add src/app/admin/
git commit -m "feat: admin AI draw from platform claimants with claimant list"
```

---

## Task 6: Quality gate

- [ ] **Step 1: Run full test suite**

Run: `cd ultimate-sd && pnpm test run`
Expected: PASS

- [ ] **Step 2: Run lint and build**

Run: `cd ultimate-sd && pnpm lint && pnpm build`
Expected: PASS

- [ ] **Step 3: Final commit if any fixups**

```bash
git add -A
git commit -m "chore: fix launch offer unified signup follow-ups"
```

---

## How you'll run the lucky draw (operator guide)

1. Share the launch offer — users **sign in** and **claim Platform** (drives signups).
2. In **Admin → Launch Offer**, watch **AI draw eligible** grow with each Platform claim.
3. When ready, click **Draw AI winners** — randomly picks up to 5 from eligible claimants, upgrades them to AI plan, sends welcome email.
4. The claimants table shows who claimed and who won.

No separate giveaway entry is needed from users.

---

## Self-review checklist

| Requirement | Task |
|-------------|------|
| Single user path: sign in + claim Platform | Task 4 |
| Auto-eligible for AI draw on claim | Task 2 (`isEligibleForAiDraw`) |
| Admin draw from launch claimants | Task 2, 5 |
| Know who signed up during launch offer | Task 2 (`getLaunchOfferPlatformClaimants`), Task 5 table |
| 5 AI plans via lucky draw | Existing `LAUNCH_AI_WINNER_SLOTS = 5`, Task 2 draw |
| Slot cap not broken when upgrading winners | Task 2 `countPlatformSlotsUsed` |
