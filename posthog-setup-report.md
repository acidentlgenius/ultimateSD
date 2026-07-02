<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep server-side integration of PostHog into the UltimateSD Next.js application using `posthog-node`. A PostHog singleton client (`ultimate-sd/src/lib/posthog.ts`) was created and imported across 7 server-side files — API routes and Server Actions — to capture 12 business-critical events covering the full user lifecycle: signup/login, practice sessions, step submissions, XP/leveling, AI evaluations, and payment flows.

| Event Name | Description | File |
|---|---|---|
| `user signed up` | New user account created via email/password | `ultimate-sd/src/app/api/auth/signup/route.ts` |
| `user logged in` | User authenticated via credentials or Google OAuth | `ultimate-sd/src/auth.ts` |
| `practice session started` | User started a new practice session for a problem | `ultimate-sd/src/app/actions/progress/sessions.ts` |
| `practice session completed` | User finished all steps with a final score | `ultimate-sd/src/app/actions/progress/sessions.ts` |
| `practice session abandoned` | User restarted a problem, abandoning their session | `ultimate-sd/src/app/actions/progress/sessions.ts` |
| `step submitted` | User submitted an answer for a practice step | `ultimate-sd/src/app/actions/progress/submissions.ts` |
| `xp awarded` | XP points awarded for completing a step | `ultimate-sd/src/app/actions/progress/submissions.ts` |
| `level up` | User advanced to a new level after accumulating XP | `ultimate-sd/src/app/actions/progress/submissions.ts` |
| `ai evaluation requested` | User requested AI feedback on a practice step | `ultimate-sd/src/app/api/ai/evaluate/route.ts` |
| `payment order created` | User initiated a subscription payment order | `ultimate-sd/src/app/api/orders/route.ts` |
| `payment verified` | Payment was verified and plan activated | `ultimate-sd/src/app/api/orders/verify/route.ts` |
| `subscription activated` | Subscription activated via Razorpay webhook | `ultimate-sd/src/app/api/webhooks/razorpay/route.ts` |

## Next steps

We've built some insights and a dashboard to keep an eye on user behavior:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/494310/dashboard/1788342)
- [Daily Signups](https://us.posthog.com/project/494310/insights/LQJwXlsS)
- [Practice Conversion Funnel](https://us.posthog.com/project/494310/insights/NIuzHPDE)
- [Payment Funnel](https://us.posthog.com/project/494310/insights/yGWomxHQ)
- [Practice Engagement](https://us.posthog.com/project/494310/insights/WlueMHze)
- [AI Evaluation Usage](https://us.posthog.com/project/494310/insights/9AZuJ60h)

## Verify before merging

- [ ] Run a full production build (`pnpm build` inside `ultimate-sd/`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` (or equivalent bootstrap scripts) so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or equivalent) into CI so production stack traces de-minify correctly.
- [ ] Confirm the returning-visitor path also calls identify — the `user logged in` handler only fires when `user?.id` is present in the JWT callback (first login), so returning sessions authenticated via cookie refresh will not fire the event again. This is intentional but worth verifying against your analytics requirements.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
