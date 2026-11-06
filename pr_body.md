fix: CI build and lint failures

- Wrapped `prisma.blogPost.findMany` inside a `try...catch` block in `blog-posts.ts` to return an empty array if the database connection fails, preventing `ECONNREFUSED` build crashes on `/sitemap.xml` generation.
- Replaced `useRef` with `useState` for `preferReducedMotion` in `AdaptiveCoachDemo.tsx` to fix ESLint `Cannot access refs during render` violations.
- Wrapped `vi.advanceTimersByTimeAsync` with `await act(async () => { ... })` and imported `act` from `@testing-library/react` in `DiagramCanvas.test.tsx` to fix React state update warnings during tests.
- Replaced the `.catch` logic inside `useEffect` in `StepFeedbackPanel.tsx` with an `async` function checking for `result?.error` handling server action return types.
- Added `aria-describedby={undefined}` to `<DialogContent>` in `FeedbackModal.tsx` to fix Radix accessibility warnings.
