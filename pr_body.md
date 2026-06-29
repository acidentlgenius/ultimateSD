💥 The Bug: `.catch` block on `getStepSubmissions` floating promise suppresses Server Action error objects.
🔍 Root Cause: Next.js Server Actions return `{ error: string }`.
🛠️ The Fix: Fixed `getStepSubmissions` to use an inner `async/await` pattern that checks `result.error`.
🛡️ Prevention: Updated `FeedbackModal.test.tsx` to assert floating promises errors.
