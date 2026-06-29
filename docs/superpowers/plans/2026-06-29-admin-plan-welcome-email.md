# Admin Plan Welcome Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an admin grants a paid plan (`platform` or `ai`) to a user via the admin portal, send a welcome email congratulating them on 3 months of access and inviting them to use the platform and share feedback.

**Architecture:** Add a `sendPlanWelcomeEmail` function alongside existing Resend auth emails in `lib/email.ts`. Admin grants use a dedicated 3-month expiry helper (separate from the 1-month self-serve payment path). Wire the email into `updateUserPlan` after the DB update succeeds; email failures are logged and surfaced to the admin without rolling back the plan change.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL, Resend (`resend` package), Vitest 4

**App root:** `ultimate-sd/`

---

## File Map

| File | Responsibility |
|------|----------------|
| `ultimate-sd/src/lib/access.ts` | Add `getAdminGrantExpiryDate()` — +3 months for admin grants |
| `ultimate-sd/src/lib/__tests__/access.test.ts` | Unit tests for admin grant expiry |
| `ultimate-sd/src/lib/plans.ts` | Add `PLAN_WELCOME_DESCRIPTIONS` for email copy |
| `ultimate-sd/src/lib/email.ts` | Add `formatPlanWelcomeEmailHtml()` + `sendPlanWelcomeEmail()` |
| `ultimate-sd/src/lib/__tests__/email.test.ts` | Unit tests for welcome email HTML and send behavior |
| `ultimate-sd/src/app/actions/admin.ts` | Use 3-month expiry; fetch user; send welcome email |
| `ultimate-sd/src/app/actions/__tests__/admin.test.ts` | Tests for `updateUserPlan` email integration |
| `ultimate-sd/src/app/admin/AdminClient.tsx` | Toast copy when email send fails |

## Scope

**In scope**
- Welcome email when admin sets plan to `platform` or `ai`
- Admin-granted plans expire in **3 months** (matches user requirement and email copy)
- Graceful handling when Resend is not configured

**Out of scope** (optional follow-up)
- Welcome email on Razorpay self-serve purchase (`activateUserPlan`)
- Idempotency / “already sent” tracking in DB
- Admin UI filter for “new / unverified users”

---

## Task 1: Admin grant expiry helper

**Files:**
- Modify: `ultimate-sd/src/lib/access.ts` (after `getPlanExpiryDate`)
- Create: `ultimate-sd/src/lib/__tests__/access.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// ultimate-sd/src/lib/__tests__/access.test.ts
import { describe, it, expect } from 'vitest';
import { getAdminGrantExpiryDate } from '../access';

describe('getAdminGrantExpiryDate', () => {
  it('returns a date 3 months after the given date', () => {
    const from = new Date('2026-01-15T12:00:00.000Z');
    const expiry = getAdminGrantExpiryDate(from);
    expect(expiry.getFullYear()).toBe(2026);
    expect(expiry.getMonth()).toBe(3); // April (0-indexed)
    expect(expiry.getDate()).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/access.test.ts`
Expected: FAIL — `getAdminGrantExpiryDate` is not exported

- [ ] **Step 3: Implement minimal helper**

Add to `ultimate-sd/src/lib/access.ts` after `getPlanExpiryDate`:

```typescript
/** Expiry for plans granted manually by an admin (3 months). */
export function getAdminGrantExpiryDate(from = new Date()): Date {
  const expiry = new Date(from);
  expiry.setMonth(expiry.getMonth() + 3);
  return expiry;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/access.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd ultimate-sd
git add src/lib/access.ts src/lib/__tests__/access.test.ts
git commit -m "feat: add 3-month admin grant expiry helper"
```

---

## Task 2: Plan welcome email

**Files:**
- Modify: `ultimate-sd/src/lib/plans.ts`
- Modify: `ultimate-sd/src/lib/email.ts`
- Create: `ultimate-sd/src/lib/__tests__/email.test.ts`

- [ ] **Step 1: Add plan descriptions for email copy**

Add to `ultimate-sd/src/lib/plans.ts` after `PLAN_LABELS`:

```typescript
export const PLAN_WELCOME_DESCRIPTIONS: Record<Exclude<PlanType, 'free'>, string> = {
  platform: 'full access to all practice problems on the platform',
  ai: 'full access to all practice problems plus monthly AI credits for feedback and the help assistant',
};
```

- [ ] **Step 2: Write the failing tests**

```typescript
// ultimate-sd/src/lib/__tests__/email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatPlanWelcomeEmailHtml, sendPlanWelcomeEmail } from '../email';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));

describe('formatPlanWelcomeEmailHtml', () => {
  it('includes plan name, expiry, and feedback invitation', () => {
    const expiresAt = new Date('2026-09-29T00:00:00.000Z');
    const html = formatPlanWelcomeEmailHtml({
      name: 'Alex',
      planLabel: 'AI',
      planDescription: 'full access to all practice problems plus monthly AI credits',
      expiresAt,
    });

    expect(html).toContain('Congratulations');
    expect(html).toContain('Alex');
    expect(html).toContain('AI');
    expect(html).toContain('3 months');
    expect(html).toContain('feedback');
    expect(html).toContain('September 29, 2026');
  });
});

describe('sendPlanWelcomeEmail', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.EMAIL_FROM = 'SysDesignAI <noreply@example.com>';
    process.env.NEXT_PUBLIC_APP_URL = 'https://ultimate-sd.vercel.app';
  });

  it('sends with a congratulations subject', async () => {
    const { Resend } = await import('resend');
    const sendMock = vi.fn().mockResolvedValue({ error: null });
    (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: sendMock },
    }));

    await sendPlanWelcomeEmail({
      email: 'user@example.com',
      name: 'Alex',
      planType: 'platform',
      expiresAt: new Date('2026-09-29T00:00:00.000Z'),
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Congratulations'),
      })
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/email.test.ts`
Expected: FAIL — `formatPlanWelcomeEmailHtml` / `sendPlanWelcomeEmail` not defined

- [ ] **Step 4: Implement email functions**

Add imports at top of `ultimate-sd/src/lib/email.ts`:

```typescript
import {
  PLAN_LABELS,
  PLAN_WELCOME_DESCRIPTIONS,
  type PlanType,
} from '@/lib/plans';
```

Add after `authEmailLayout`:

```typescript
function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export interface PlanWelcomeEmailParams {
  name: string | null;
  planLabel: string;
  planDescription: string;
  expiresAt: Date;
}

export function formatPlanWelcomeEmailHtml(params: PlanWelcomeEmailParams): string {
  const greeting = params.name ? `Hi ${params.name},` : 'Hi there,';
  const expiryFormatted = formatExpiryDate(params.expiresAt);
  const dashboardUrl = `${SITE_URL}/home`;

  return authEmailLayout(
    'Welcome to SysDesignAI',
    `
      <p>${greeting}</p>
      <p>
        Congratulations! You have been given access to the
        <strong>${params.planLabel}</strong> plan for the next
        <strong>3 months</strong> (until ${expiryFormatted}).
      </p>
      <p>
        Your plan includes ${params.planDescription}.
        Please feel free to use the platform and share any feedback you have —
        we would love to hear from you.
      </p>
    `,
    'Start Practicing',
    dashboardUrl,
    'If you have questions, reply to this email or contact support.'
  );
}

export async function sendPlanWelcomeEmail(options: {
  email: string;
  name: string | null;
  planType: Exclude<PlanType, 'free'>;
  expiresAt: Date;
}): Promise<void> {
  const planLabel = PLAN_LABELS[options.planType];
  const planDescription = PLAN_WELCOME_DESCRIPTIONS[options.planType];

  await sendMail({
    to: options.email,
    subject: `Congratulations — your ${planLabel} plan is ready`,
    html: formatPlanWelcomeEmailHtml({
      name: options.name,
      planLabel,
      planDescription,
      expiresAt: options.expiresAt,
    }),
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ultimate-sd && pnpm test run src/lib/__tests__/email.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd ultimate-sd
git add src/lib/plans.ts src/lib/email.ts src/lib/__tests__/email.test.ts
git commit -m "feat: add plan welcome email for admin grants"
```

---

## Task 3: Wire email into admin plan assignment

**Files:**
- Modify: `ultimate-sd/src/app/actions/admin.ts`
- Create: `ultimate-sd/src/app/actions/__tests__/admin.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// ultimate-sd/src/app/actions/__tests__/admin.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockSendPlanWelcomeEmail = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('@/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }));
vi.mock('@/lib/email', () => ({
  EmailConfigurationError: class EmailConfigurationError extends Error {
    name = 'EmailConfigurationError';
  },
  sendPlanWelcomeEmail: (...args: unknown[]) => mockSendPlanWelcomeEmail(...args),
}));

import { updateUserPlan } from '../admin';

describe('updateUserPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFindUnique
      .mockResolvedValueOnce({ role: 'ADMIN' }) // requireAdmin
      .mockResolvedValueOnce({ email: 'user@example.com', name: 'Alex' }); // post-update fetch
    mockUpdate.mockResolvedValue({});
    mockSendPlanWelcomeEmail.mockResolvedValue(undefined);
  });

  it('sends welcome email when granting a paid plan', async () => {
    const result = await updateUserPlan('user-1', 'platform');

    expect(result).toEqual({ success: true, emailSent: true });
    expect(mockSendPlanWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        name: 'Alex',
        planType: 'platform',
      })
    );
  });

  it('does not send welcome email when setting free plan', async () => {
    const result = await updateUserPlan('user-1', 'free');

    expect(result).toEqual({ success: true, emailSent: false });
    expect(mockSendPlanWelcomeEmail).not.toHaveBeenCalled();
  });

  it('returns success with emailSent false when email is not configured', async () => {
    const { EmailConfigurationError } = await import('@/lib/email');
    mockSendPlanWelcomeEmail.mockRejectedValue(new EmailConfigurationError());

    const result = await updateUserPlan('user-1', 'ai');

    expect(result).toEqual({ success: true, emailSent: false });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ultimate-sd && pnpm test run src/app/actions/__tests__/admin.test.ts`
Expected: FAIL — return shape / email not wired

- [ ] **Step 3: Update `updateUserPlan`**

Replace contents of `ultimate-sd/src/app/actions/admin.ts` with:

```typescript
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  getAdminGrantExpiryDate,
  getInitialAiCreditsForPlan,
  getNextAiCreditsResetDate,
} from '@/lib/access';
import { EmailConfigurationError, sendPlanWelcomeEmail } from '@/lib/email';
import { type PlanType } from '@/lib/plans';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  return session.user.id;
}

export async function updateUserPlan(userId: string, planType: PlanType) {
  await requireAdmin();

  const now = new Date();
  const planExpiresAt =
    planType !== 'free' ? getAdminGrantExpiryDate(now) : null;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        planType,
        planExpiresAt,
        planActivatedAt: planType !== 'free' ? now : null,
        aiCredits: getInitialAiCreditsForPlan(planType),
        aiCreditsResetAt: planType === 'ai' ? getNextAiCreditsResetDate(now) : null,
      },
    });

    let emailSent = false;

    if (planType === 'platform' || planType === 'ai') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        try {
          await sendPlanWelcomeEmail({
            email: user.email,
            name: user.name,
            planType,
            expiresAt: planExpiresAt!,
          });
          emailSent = true;
        } catch (error) {
          if (error instanceof EmailConfigurationError) {
            console.error('Plan welcome email config error:', error.message);
          } else {
            console.error('Plan welcome email error:', error);
          }
        }
      }
    }

    revalidatePath('/admin');
    return { success: true, emailSent };
  } catch (error) {
    console.error('Failed to update user plan:', error);
    return { error: 'Failed to update user plan' };
  }
}

export async function revokeUserAccess(userId: string) {
  await requireAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: 'free',
        planExpiresAt: null,
        planActivatedAt: null,
        aiCredits: 0,
        aiCreditsResetAt: null,
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to revoke access:', error);
    return { error: 'Failed to revoke access' };
  }
}
```

Note: remove unused `getPlanExpiryDate` import.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ultimate-sd && pnpm test run src/app/actions/__tests__/admin.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd ultimate-sd
git add src/app/actions/admin.ts src/app/actions/__tests__/admin.test.ts
git commit -m "feat: send welcome email when admin grants paid plan"
```

---

## Task 4: Admin UI feedback

**Files:**
- Modify: `ultimate-sd/src/app/admin/AdminClient.tsx` (in `handleUpdatePlan`)

- [ ] **Step 1: Update toast messages**

In `handleUpdatePlan`, replace the success branch:

```typescript
if (result.error) {
  toast.error(result.error);
} else if (planType !== 'free' && result.emailSent === false) {
  toast.success(`Plan updated to ${planType}`, {
    description: 'Welcome email could not be sent. Check email configuration.',
  });
  router.refresh();
} else {
  toast.success(
    planType === 'free'
      ? `Plan updated to ${planType}`
      : `Plan updated to ${planType}. Welcome email sent.`
  );
  router.refresh();
}
```

- [ ] **Step 2: Manual smoke test**

1. Ensure `.env` has `RESEND_API_KEY` and `EMAIL_FROM`
2. Run `pnpm dev`
3. Log in as admin → `/admin`
4. Grant `platform` or `ai` to a test user
5. Confirm toast says welcome email sent
6. Confirm email arrives with 3-month messaging and dashboard CTA

- [ ] **Step 3: Commit**

```bash
cd ultimate-sd
git add src/app/admin/AdminClient.tsx
git commit -m "feat: surface welcome email status in admin toasts"
```

---

## Task 5: Quality gate

- [ ] **Step 1: Run full test suite**

Run: `cd ultimate-sd && pnpm test run`
Expected: all tests PASS

- [ ] **Step 2: Lint**

Run: `cd ultimate-sd && pnpm lint`
Expected: no new errors

- [ ] **Step 3: Build**

Run: `cd ultimate-sd && pnpm build`
Expected: build succeeds

---

## Self-Review

| Requirement | Covered by |
|-------------|------------|
| Admin grants plan via portal | Task 3 — existing `updateUserPlan` flow |
| Welcome email on grant | Task 2 + Task 3 |
| “Congratulations” + 3 months messaging | Task 2 — `formatPlanWelcomeEmailHtml` |
| Invite to use platform + feedback | Task 2 — email body copy |
| 3-month access duration | Task 1 + Task 3 — `getAdminGrantExpiryDate` |
| Email failure doesn’t block grant | Task 3 — catch + `emailSent: false` |
| Admin sees email status | Task 4 — toast |

**Assumptions documented:**
- Admin grants are 3 months; Razorpay purchases remain 1 month (`activateUserPlan` unchanged).
- Email sends on every paid-plan admin assignment (including re-assignments).
- Users with unverified email still receive the welcome email if they have an address on file.
