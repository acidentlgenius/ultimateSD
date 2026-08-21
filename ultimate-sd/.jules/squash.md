## 2024-06-19 - Failed Vitest execution on Next server components

**Learning:** Testing Next.js React Server Components with Next-Auth and Prisma can crash Vitest due to how modules are resolved in the jsdom environment.

**Action:** Mocks for `@/auth`, `@/lib/prisma`, and server actions are required to test the basic rendering of Next Server Components in a Vitest JSDOM environment.

## 2024-06-19 - Silent failures from hanging external API calls

**Learning:** The AI API routes relied on native `fetch` inside `try/catch` blocks. However, `fetch` only rejects on network errors, not on timeouts or HTTP error statuses by default. This can cause the frontend components to hang indefinitely in a loading state if the backend LLM service is slow or unresponsive.

**Action:** Replaced native `fetch` with a custom `fetchWithRetry` utility (using `AbortController` for timeouts) to guarantee that components eventually fail cleanly rather than freezing the application state.

## 2024-06-19 - Potential data inconsistency from sequential Prisma mutations

**Learning:** Server actions performing multiple related updates (e.g. creating a step submission, updating progress, modifying user XP) were using separate awaited Prisma calls. A failure midway would lead to orphaned data (e.g., XP awarded but progress not updated).

**Action:** Grouped related Prisma calls inside a `prisma.$transaction([])` array to guarantee atomicity.

## 2024-06-19 - Unrecoverable UI crashes from corrupt LocalStorage JSON

**Learning:** Parsing `localStorage` data using `JSON.parse` inside a `try/catch` was logging the error but leaving the corrupt string in storage. This meant on every reload, the application would hit the error again, preventing components like `DiagramCanvas` from initializing a clean state.

**Action:** Updated `catch` blocks around `JSON.parse` on `localStorage` values to explicitly call `localStorage.removeItem(key)`, allowing the component to recover cleanly on the next render pass.

## 2024-07-01 - Infinite UI crash loops from unparseable JSON in LocalStorage

**Learning:** `loadSessionState` relied on `clearSessionState(problemSlug)` to handle invalid data. However, if the `localStorage` key contained structurally valid JSON but the *content itself* was not valid JSON (causing `JSON.parse` to throw), the catch block would execute. But if `clearSessionState` failed or wasn't robust enough, the corrupted data stayed. On every subsequent mount, the UI would try to parse the corrupt data, throw, and crash again.

**Action:** When purging corrupted or unparseable `localStorage` state, use direct `localStorage.removeItem(key)` rather than higher-level helpers to guarantee the bad data is purged, since helper methods might inadvertently fail when interacting with corrupted state.

## 2024-07-15 - Unwrapped React State Updates in Timers

**Learning:** Vitest tests advancing fake timers asynchronously (`vi.advanceTimersByTimeAsync`) can trigger unhandled React state updates if the timer resolves a promise that updates state (e.g., auto-saving). This leads to noisy `act(...)` console warnings which can fail strict CI checks or obscure real failures.

**Action:** Always wrap `vi.advanceTimersByTimeAsync` (and similar async fake timer advances) inside `act()` when testing React components with side effects, to properly flush the React rendering queue.

## 2024-07-15 - Test Output Pollution from Expected Error Paths

**Learning:** Testing explicit error paths (like unparseable JSON, server action failures, or missing configuration) causes intentional error logs to pollute the Vitest runner output. If a codebase considers warnings/errors as failures (or just to keep test output clean), this can cause confusion or break CI.

**Action:** Suppress expected `console.error` and `console.warn` calls locally within the specific test blocks testing error handling, using `vi.spyOn(console, 'error').mockImplementation(() => {})` and ensuring `.mockRestore()` is called afterward.

## 2024-07-15 - Missing Accessibility Labels on Radix UI Dialogs

**Learning:** Radix UI `DialogContent` requires either a `<DialogDescription>` or an explicit `aria-describedby={undefined}` to be fully accessible to screen readers; otherwise, it throws React warnings which pollute test logs.

**Action:** Always provide `aria-describedby={undefined}` on `DialogContent` when a description text is intentionally omitted to suppress accessibility warnings and maintain clean test output.
