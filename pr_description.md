💥 The Bug:
When a user completed a step, the `updateStreak` Server Action was called inside a `useEffect` in `StepFeedbackPanel.tsx`. However, instead of awaiting the result, a `.catch()` was appended to the promise. Since Next.js Server Actions typically return error objects (like `{ error: 'User not found' }`) instead of throwing exceptions, this setup silently swallowed application-level errors and only caught network-level throws.

🔍 Root Cause:
Appending `.catch()` directly to an asynchronous Next.js Server Action invocation only catches unhandled Promise rejections (e.g. network drops), but entirely ignores standard application responses returning an object containing an `error` key.

🛠️ The Fix:
Wrapped the `updateStreak()` call inside an inner `async () => {}` function inside the `useEffect`. It now properly `await`s the server action response and explicitly logs `result.error` if one is returned, while still preserving the original `try/catch` to log real network exceptions.

🛡️ Prevention:
Added two new regression unit tests in `StepFeedbackPanel.test.tsx` verifying that both returned error objects and thrown error exceptions are successfully caught and passed to `console.error`.
