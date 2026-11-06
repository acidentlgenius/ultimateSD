fix: Gamification action and UI warnings

- Replace the `.catch` logic inside `useEffect` in `StepFeedbackPanel.tsx` with an `async` function checking for `result?.error` handling server action return types.
- Add `aria-describedby={undefined}` to `<DialogContent>` in `FeedbackModal.tsx` to fix Radix accessibility warnings.
- Wrap `vi.advanceTimersByTimeAsync` with `await act(async () => { ... })` and imported `act` from `@testing-library/react` in `DiagramCanvas.test.tsx` to fix React state update warnings during tests.
