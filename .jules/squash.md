## 2025-02-27 - DiagramCanvas test async state warnings

**Learning:** Tests using `vi.advanceTimersByTimeAsync` to simulate delays in React components with asynchronous state updates (like Excalidraw integrations) can trigger "An update to [Component] inside a test was not wrapped in act(...)" warnings if those timers trigger state-changing side effects. This happens because the asynchronous resolution isn't tracked by the React test renderer without `act`.

**Action:** When advancing fake timers asynchronously in React tests (e.g. for debounced saves or timeouts), always wrap `await vi.advanceTimersByTimeAsync(...)` inside `await act(async () => { ... })`. This ensures React captures any resulting state mutations and prevents test output pollution or flaky behavior.

## 2025-02-27 - AdaptiveCoachDemo ref accessed during render

**Learning:** Accessing a React `useRef`'s `.current` value directly during the render cycle (e.g., conditionally rendering UI based on `myRef.current`) throws a strict lint error ("Cannot access refs during render"). Refs are mutable but their mutation does not trigger re-renders, making them unsafe to read during rendering as it leads to inconsistent state.

**Action:** If a value dictates conditional rendering, it must be stored in `useState`, not `useRef`. If it's a DOM/browser API check like `window.matchMedia`, initialize it via `useState` inside a `useEffect`.

## 2025-02-27 - Next.js sitemap build failures with Prisma

**Learning:** During Next.js builds (`pnpm build`), files like `sitemap.ts` that query the database using Prisma (e.g., fetching dynamic URLs) are pre-rendered by default. In CI environments where the database isn't running or available to the build step, this causes an `ECONNREFUSED` error that breaks the build.

**Action:** Add `export const dynamic = 'force-dynamic';` to `sitemap.ts` (and any similar dynamic file that queries the DB during build) to bypass build-time prerendering and fetch the dynamic data at request time instead.
