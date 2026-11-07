💥 The Bug:
In `StepFeedbackPanel.tsx`, the `updateStreak` Server Action was being called as a floating promise (`void updateStreak().catch(...)`). Because Next.js Server Actions in this project return error objects instead of throwing exceptions, the `.catch` block never executed on application-level errors, silently swallowing streak update failures. Additionally, several build and test errors were occurring due to unhandled database connection failures (`ECONNREFUSED`) during Next.js prerendering, a `Cannot access refs during render` error in `AdaptiveCoachDemo.tsx`, and a playwright E2E failure due to a missing DOM element on the dashboard.

🔍 Root Cause:
1. Server Actions return `{ error: string }` instead of rejecting the promise on logical server errors. Appending `.catch()` only captures network-level errors, leaving server logic failures unhandled.
2. Next.js prerendering steps (`sitemap.ts`, etc.) crash the build if the database is unreachable (`ECONNREFUSED`) when making Prisma calls.
3. Accessing a `useRef`'s `.current` property during the render phase in `AdaptiveCoachDemo.tsx` violates React's concurrent rendering rules.
4. E2E tests for the guest funnel failed because `DashboardClient.tsx` was missing the `StartHereTrack` component, which the tests expected to interact with.

🛠️ The Fix:
1. Refactored the `useEffect` in `StepFeedbackPanel.tsx` to explicitly `await` the Server Action and check for the `error` property to log it appropriately.
2. Wrapped database queries in `try/catch` blocks in `sitemap.ts`, `feature-flags-server.ts`, and `launch-offer-grant.ts` to gracefully degrade if the database is unreachable during Next.js builds.
3. Changed `preferReducedMotion` from `useRef` to `useState` in `AdaptiveCoachDemo.tsx` and added it to the `useEffect` dependency arrays, resolving the linter error.
4. Added the missing `StartHereTrack` and `MostAskedSection` components back to the unauthenticated view in `DashboardClient.tsx` so E2E tests pass.
5. Fixed `deleteMany({})` in `seed-e2e.ts` to `deleteMany()` to prevent Prisma invalid invocation errors.

🛡️ Prevention:
Created robust regression tests in `src/components/__tests__/StepFeedbackPanel.defend.test.tsx` that explicitly mock both server action failures (resolved error object) and network failures (rejected promise), verifying that the errors are logged correctly in both scenarios. Added journal entries for the `ECONNREFUSED` and `deleteMany({})` issues.
