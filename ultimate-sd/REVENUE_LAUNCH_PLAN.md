# UltimateSD Revenue Launch Plan

**Goal**: Convert UltimateSD (SysDesignAI) into a sustainable, revenue-generating product **without killing the free user experience**. Launch fast, start charging, and keep a delightful free tier that converts.

**Date**: 2026-06-19  
**Status**: Ready for execution  
**Target**: First paying users within 1–2 weeks of focused work

---

## Recommended Business Model

### Free Tier (Growth + Delight)
- Access to **8 high-quality starter problems**
- Full experience for those problems: step-by-step practice, interactive diagram canvas, all widgets/simulators, gamification, streaks, PDF export (limited), progress tracking
- **BYOK (Bring Your Own Key) required** for any AI features (evaluation, conversational interviewer, help assistant)
- All non-AI features (draw page, simulations, roadmap preview) remain completely free
- Goal: Let users experience the magic and get hooked

### Pro Tier (The Money)
- Access to **all 85+ problems**
- Unlimited AI usage (can still use personal BYOK keys, or platform-provided AI)
- Unlimited PDF revision guides
- Full access to expert solutions (when exposed)
- Unlocks the complete guided curriculum + advanced problems

### Pricing (Suggested)
| Plan       | Price (India)     | Price (Global)     | Notes                          |
|------------|-------------------|--------------------|--------------------------------|
| Free       | ₹0                | $0                 | 8 starter problems + BYOK      |
| Monthly    | ₹499              | $9–12              | Good for interview prep sprints|
| Lifetime   | ₹1,499 – ₹1,999   | $29                | **Best value** – highlight this|

**Rationale**: Low enough barrier + very attractive lifetime option (matches successful patterns from similar tools). Lifetime reduces churn anxiety for users.

**Cost Control**: Heavy use of **BYOK** for Free tier keeps server LLM costs near zero.

---

## Starter Free Problems (Exact List)

Define these as the **only** freely accessible problems.

Recommended 8:

1. `design-tinyurl` – Classic, easy entry point
2. `design-parking-lot` – Real-world, concrete, Easy
3. `design-elevator-system` – Good systems thinking
4. `design-unique-id-generator` – Fundamental building block
5. `design-typeahead-suggestion` – Search/autocomplete pattern
6. `design-distributed-cache` – Important but not overwhelming
7. `design-dropbox` – File sync is relatable
8. `design-whatsapp` – Popular real-time messaging

**How to implement**: Create a constant array of slugs.

```ts
export const FREE_PROBLEM_SLUGS = [
  'design-tinyurl',
  'design-parking-lot',
  'design-elevator-system',
  'design-unique-id-generator',
  'design-typeahead-suggestion',
  'design-distributed-cache',
  'design-dropbox',
  'design-whatsapp',
] as const;
```

All other problems show as **locked**.

---

## Why This Model Will Work

- **Free users stay happy**: They get real value immediately (structure + simulations + 8 solid problems).
- **Clear upgrade path**: "You’ve mastered the basics. Unlock 75+ FAANG problems + unlimited AI feedback."
- **Zero (or near-zero) marginal cost** on Free tier thanks to BYOK.
- **High perceived value** on Pro because the AI feedback + breadth is genuinely useful.
- **Low friction payment**: Lifetime option converts well.

---

## Prioritized Implementation Plan

Do these in order. Higher priority = bigger impact on ability to charge money.

### Phase 1: Foundation & Stop Giving It Away for Free (Day 1–2)

1. **Decide & Lock In the Model**
   - Finalize the 8 free slugs above (or tweak).
   - Document the exact differences between Free and Pro in this file or a short `PRICING.md`.

2. **Fix All "Everything is Free" Messaging**
   - [src/app/pricing/page.tsx](src/app/pricing/page.tsx) — complete rewrite
   - [src/components/landing/PricingSection.tsx](src/components/landing/PricingSection.tsx)
   - Settings billing section
   - Any "now free for everyone" text or comments
   - Update hero / dashboard copy to set correct expectations

3. **Database Schema Changes**
   Add to `prisma/schema.prisma` on the `User` model:

   ```prisma
   // Subscription
   planType        String?    // "free" | "pro" | "lifetime"
   planExpiresAt   DateTime?
   planActivatedAt DateTime?

   // BYOK keys (stored server-side, never returned to client after save)
   xaiApiKey       String?
   geminiApiKey    String?
   preferredProvider String   @default("gemini")
   ```

   Run `prisma migrate dev --name add_pro_plan_and_byok`

4. **Create Central Access Control**
   - New file: `src/lib/access.ts`
   - Exports:
     - `FREE_PROBLEM_SLUGS`
     - `isProblemFree(slug: string)`
     - `getUserPlan(user)` 
     - `hasActivePro(user)`
     - `canAccessProblem(user, slug)`
     - `canUseAI(user)` (based on plan or having keys)

5. **Update Auth / Session**
   - Extend NextAuth JWT + session callbacks to include `planType`, `hasPro`, etc.
   - Update `src/types/next-auth.d.ts` and `auth.ts`

### Phase 2: Visible Gating & Locked Experience (Day 2–3)

6. **Problem Listing Gating**
   - Update `DashboardClient.tsx` and `UserHero.tsx`
   - Pass `locked` prop to `ProblemCard`
   - In grid + table views: non-free problems get locked treatment

7. **Enhance ProblemCard**
   - Already supports `locked` prop + Lock icon.
   - On locked cards:
     - Prevent navigation or intercept click
     - Open contextual `ProModal`
     - Show "Pro" badge or "Unlock with Pro" call-to-action

8. **Practice Page Protection**
   - In `src/app/practice/[slug]/page.tsx`:
     - Server-side check using `canAccessProblem`
     - If locked → redirect to `/pricing` or render blocked state

9. **Improve ProModal**
   - Make it accept props: `reason`, `problemTitle`
   - Show value props + pricing buttons
   - Add "Continue with Free problems" link

10. **Update Recommendations**
    - `src/app/actions/recommendations.ts` should prefer or limit to free problems for non-Pro users.

### Phase 3: BYOK + AI Gating (Most Important Technical Work) (Day 3–5)

11. **Add Key Management UI**
    - Extend Settings page / SettingsClient
    - Allow saving xAI and Gemini keys + choosing preferred provider
    - Show "Key saved" status (never show the actual key)

12. **Refactor AI Layer for BYOK**
    Refactor these to dynamically use user keys when available:

    - `src/lib/langgraph.ts` (getAIResponse + getFeedback)
    - `src/lib/help-langgraph.ts`
    - `src/app/api/ai/evaluate/route.ts`
    - `src/app/api/ai/chat/route.ts`
    - `src/app/api/ai/help/route.ts`

    **New behavior**:
    - Try to load user's stored keys from DB
    - If user has valid key → use it
    - If on free problem + no key → return clear error + prompt to add key or upgrade
    - Pro users: can fall back to server `GOOGLE_API_KEY` (optional)

13. **Gate AI Calls in UI**
    - In `StepByStepChat.tsx`, `PracticeUI.tsx`, `FeedbackModal`, etc.
    - Before calling AI endpoints, check access and show upgrade or "add key" flow.

14. **(Optional but recommended)** Simple Usage Tracking
    - Add a lightweight `AIUsage` model or counter on User for free tier daily limits (can start without this).

### Phase 4: Payments & Activation (Revenue On Switch) (Day 4–6)

15. **Payment Links / Integration**
    - **Fastest path**: Create Razorpay hosted payment links (Monthly + Lifetime) — exactly like DesignLab.
    - Add buttons/links in Pricing page, ProModal, Settings.

16. **Activation Flow**
    - Create `src/app/api/activate/route.ts` (or reuse admin pattern)
    - Simple version (MVP):
      - After payment, user is given a code or we manually activate via admin route
    - Better version:
      - Razorpay webhook (`/api/webhooks/razorpay`) that verifies signature and activates the plan
    - Update user record: `planType`, `planExpiresAt` (for monthly), `planActivatedAt`

17. **Protect Value**
    - Gate PDF export button (hide or show modal)
    - Gate full solutions viewer if present
    - Any future "unlimited" features

18. **Billing UI**
    - In Settings → Subscription tab: show current plan status, next billing, "Manage keys", upgrade buttons.

### Phase 5: Polish, Conversion & Launch (Day 6–8)

19. **Landing & Hero Updates**
    - Update copy: "Master 8 core problems for free. Unlock 75+ FAANG-level challenges + unlimited AI feedback with Pro."
    - Add trust signals + clear upgrade path

20. **Update All Docs & Copy**
    - README
    - Terms page (already has Pro language — make consistent)
    - Any other marketing copy

21. **Admin Tools**
    - Simple protected admin activation page (similar to `SystemDesignApp/app/api/admin/activate`)
    - Ability to view users + plans

22. **Testing Checklist**
    - Free user flow end-to-end
    - Locked problem → ProModal → Pricing
    - Add BYOK key → AI works on free problem
    - Payment simulation → activation → full access
    - Session refresh reflects new plan

23. **Launch**
    - Deploy
    - Announce (Twitter, LinkedIn, Reddit, Discord, etc.)
    - Add simple analytics (upgrade button clicks, problem start counts by plan)

---

## Technical Notes & Files to Touch (Summary)

### Core New/Changed Files
- `prisma/schema.prisma`
- `src/lib/access.ts` (new)
- `src/app/pricing/page.tsx`
- `src/components/landing/PricingSection.tsx`
- `src/components/ProModal.tsx`
- `src/components/ProblemCard.tsx`
- `src/app/practice/[slug]/page.tsx`
- `src/lib/langgraph.ts` + `help-langgraph.ts`
- `src/app/api/ai/**/route.ts` (3 files)
- `src/app/actions/recommendations.ts`
- `src/app/settings/SettingsClient.tsx`
- `src/app/api/activate/route.ts` (new or admin)
- `auth.ts` + types for session

### AI Refactoring Pattern
Create a helper:

```ts
export async function getUserLLM(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const key = user?.preferredProvider === 'xai' 
    ? user.xaiApiKey 
    : user.geminiApiKey;

  if (key) {
    // return instance using user's key
  }
  // fallback or error
}
```

---

## Risks & Mitigations

| Risk                        | Mitigation                                      |
|----------------------------|-------------------------------------------------|
| Free users feel limited    | Make the 8 free problems excellent + promote widgets heavily |
| Users don't want to manage API keys | Offer Pro users server-side AI fallback |
| Payment friction           | Start with hosted Razorpay links + manual activation |
| AI quality drops with BYOK | Document good free tiers (Gemini Flash, Grok) |
| Churn on monthly           | Strong lifetime offer + clear value |

---

## Post-Launch Growth Ideas

- Email sequence for free users after they complete 2–3 problems
- "Pro unlock" banners inside the practice UI after completing free problems
- Limited-time lifetime discount for early users
- Add more free problems slowly over time (as loss leaders)
- Future: Team plans, interview coach add-on, etc.

---

## How to Execute This Plan With an LLM

Each step is designed to be promptable. Examples:

> "Implement step 3: Update the Prisma schema with plan and BYOK fields, then write the migration command."

> "Rewrite src/app/pricing/page.tsx according to the model in REVENUE_LAUNCH_PLAN.md"

> "Refactor lib/langgraph.ts to support per-user API keys. Follow the pattern from SystemDesignApp."

---

## Immediate Next Actions (Start Here)

1. Review and lock the list of 8 free problems.
2. Run the schema change + create `src/lib/access.ts`.
3. Completely rewrite the pricing page.
4. Make ProblemCard + dashboard show locked state for non-free problems.
5. Start the BYOK refactoring (biggest technical win).

---

**This plan is ready to execute.** Focus on Phases 1–3 first — that alone will let you flip the switch from "free for everyone" to a real product that can generate revenue while still feeling generous.

Once the first pieces are done, share progress or ask me to implement specific steps from this document.