💥 The Bug:
In `StepFeedbackPanel.tsx`, the `updateStreak` Server Action was being called as a floating promise (`void updateStreak().catch(...)`). Because Next.js Server Actions in this project return error objects instead of throwing exceptions, the `.catch` block never executed on application-level errors, silently swallowing streak update failures.

🔍 Root Cause:
Server Actions return `{ error: string }` instead of rejecting the promise on logical server errors. Appending `.catch()` only captures network-level errors, leaving server logic failures unhandled.

🛠️ The Fix:
Refactored the `useEffect` in `StepFeedbackPanel.tsx` to use an inner `async` function (`handleStreakUpdate`). The action is now `await`ed, and the returned object is explicitly checked for the `error` property to log it appropriately.

🛡️ Prevention:
Created robust regression tests in `src/components/__tests__/StepFeedbackPanel.defend.test.tsx` that explicitly mock both server action failures (resolved error object) and network failures (rejected promise), verifying that the errors are logged correctly in both scenarios.
