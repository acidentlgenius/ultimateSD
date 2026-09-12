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

## 2024-09-12 - Fix CI linting errors due to ref access during render
**Learning:** Reading a `useRef` directly during a React component's render phase (e.g. `const shown = preferReducedMotion.current ? ...`) violates React rules and triggers `react-hooks/refs` linting errors, which breaks the CI pipeline.
**Action:** Replace the `useRef` with `useState` and update the dependency arrays of relevant `useEffect` hooks to ensure safe access and reactivity without breaking strict mode rules.

## 2024-09-12 - Fix E2E test failures caused by button and copy updates
**Learning:** E2E tests often fail when the visible copy, roles, or structure of UI components change (e.g., changing "Submit for Review" to "Submit answer" or updating a section header from "New here? Start with these five" to "Structured Learning Paths"). Playwright tests rely on explicit text and semantic roles.
**Action:** When updating UI components, also search the `e2e/` directory for any assertions (`getByRole`, `getByText`) that depend on the old copy and update them accordingly.
