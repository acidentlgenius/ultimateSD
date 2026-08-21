## 2025-02-27 - DiagramCanvas test async state warnings

**Learning:** Tests using `vi.advanceTimersByTimeAsync` to simulate delays in React components with asynchronous state updates (like Excalidraw integrations) can trigger "An update to [Component] inside a test was not wrapped in act(...)" warnings if those timers trigger state-changing side effects. This happens because the asynchronous resolution isn't tracked by the React test renderer without `act`.

**Action:** When advancing fake timers asynchronously in React tests (e.g. for debounced saves or timeouts), always wrap `await vi.advanceTimersByTimeAsync(...)` inside `await act(async () => { ... })`. This ensures React captures any resulting state mutations and prevents test output pollution or flaky behavior.
