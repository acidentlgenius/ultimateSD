## 2025-02-23 - React State Updates in vitest using fake timers

**Learning:** When using vitest's fake timers (`vi.advanceTimersByTimeAsync`) that trigger React state updates, it throws warnings "An update to DiagramCanvas inside a test was not wrapped in act(...)". While these warnings may appear harmless, they can cause test instability and flaky executions.
**Action:** When testing React components that rely on timeouts or intervals for state updates using fake timers, always wrap the timer progression with `await act(async () => { await vi.advanceTimersByTimeAsync(...) })` to ensure React processes all state changes before the next assertion.

## 2025-02-23 - Suppressing expected error logs during negative testing

**Learning:** When writing tests that intentionally trigger and test error handling (e.g. malformed DB rows, unparseable JSON), the functions under test often use `console.error` or `console.warn` as part of their graceful degradation strategy. This pollutes the test output making it hard to read.
**Action:** In error-scenario tests, use `vi.spyOn(console, 'error').mockImplementation(() => {})` (or `warn`) to swallow the expected logs, and always restore the mock at the end of the test with `mockRestore()` so it doesn't affect other tests.

## 2025-02-23 - Dialog accessibility descriptions

**Learning:** Radix UI / shadcn Dialog components require both a Title and a Description for accessibility compliance. Omitting the Description causes `Warning: Missing Description or aria-describedby={undefined} for {DialogContent}` in tests.
**Action:** Always include a `<DialogDescription>` within `<DialogHeader>`. If no visible description is needed, use `<DialogDescription className="sr-only">Your description here</DialogDescription>` to satisfy screen readers and suppress warnings while keeping the visual design intact.

## 2025-02-23 - React State Updates in vitest using fake timers

**Learning:** When using vitest's fake timers (`vi.advanceTimersByTimeAsync`) that trigger React state updates, it throws warnings "An update to DiagramCanvas inside a test was not wrapped in act(...)". While these warnings may appear harmless, they can cause test instability and flaky executions.
**Action:** When testing React components that rely on timeouts or intervals for state updates using fake timers, always wrap the timer progression with `await act(async () => { await vi.advanceTimersByTimeAsync(...) })` to ensure React processes all state changes before the next assertion.

## 2025-02-23 - Suppressing expected error logs during negative testing

**Learning:** When writing tests that intentionally trigger and test error handling (e.g. malformed DB rows, unparseable JSON), the functions under test often use `console.error` or `console.warn` as part of their graceful degradation strategy. This pollutes the test output making it hard to read.
**Action:** In error-scenario tests, use `vi.spyOn(console, 'error').mockImplementation(() => {})` (or `warn`) to swallow the expected logs, and always restore the mock at the end of the test with `mockRestore()` so it doesn't affect other tests.

## 2025-02-23 - Dialog accessibility descriptions

**Learning:** Radix UI / shadcn Dialog components require both a Title and a Description for accessibility compliance. Omitting the Description causes `Warning: Missing Description or aria-describedby={undefined} for {DialogContent}` in tests.
**Action:** Always include a `<DialogDescription>` within `<DialogHeader>`. If no visible description is needed, use `<DialogDescription className="sr-only">Your description here</DialogDescription>` to satisfy screen readers and suppress warnings while keeping the visual design intact.

## 2025-02-23 - React State Updates in vitest using fake timers

**Learning:** When using vitest's fake timers (`vi.advanceTimersByTimeAsync`) that trigger React state updates, it throws warnings "An update to DiagramCanvas inside a test was not wrapped in act(...)". While these warnings may appear harmless, they can cause test instability and flaky executions.
**Action:** When testing React components that rely on timeouts or intervals for state updates using fake timers, always wrap the timer progression with `await act(async () => { await vi.advanceTimersByTimeAsync(...) })` to ensure React processes all state changes before the next assertion.

## 2025-02-23 - Reading useRef values during render

**Learning:** Reading `useRef` values (like `preferReducedMotion.current`) during a React component's render phase is an anti-pattern that violates React strict mode (triggering `react-hooks/refs` lint errors) and causes stale closures or failed hydration.
**Action:** Replace these refs with `useState` and include the state variable in relevant `useEffect` dependency arrays to ensure the component re-renders properly when the value changes.
