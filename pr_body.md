💥 The Bug
Running Vitest tests triggered multiple console warnings complaining about `Warning: Missing Description or aria-describedby={undefined} for {DialogContent}.` from the `FeedbackModal` component. This clutter makes actual test errors harder to spot.

🔍 Root Cause
Radix UI's `DialogContent` component (used by shadcn/ui) strictly enforces accessibility standards. If a modal does not have a `<DialogDescription>`, Radix assumes it's a mistake and throws a warning unless explicitly told otherwise. `FeedbackModal` omitted the description text without explicitly suppressing the warning.

🛠️ The Fix
Explicitly added `aria-describedby={undefined}` to the `DialogContent` component in `FeedbackModal.tsx` to signal to Radix that the omission of a description is intentional and structurally safe.

🛡️ Prevention
Added a regression test to `FeedbackModal.test.tsx` that monitors console errors during the component's rendering and asserts that the specific `aria-describedby` warning is not logged.
