## 2025-03-08 - Fixed Silent Failures in updateStreak Server Actions

**Learning:** Next.js Server Actions return objects containing errors instead of throwing them, which caused chained `.catch()` blocks in client components to be completely ignored. This resulted in silent logic failures across the app where errors were expected to trigger fallback behavior or toasts.
**Action:** Always wrap server actions in `async` functions when calling them from client components or `useEffect` hooks, `await` the response, explicitly check for `.error`, and use `try/catch` strictly for actual network failures.

## 2025-03-08 - Fixed React Hooks/Refs Assignment in Next.js Turbopack Build

**Learning:** Assigning a value to a `useRef`'s `.current` property during the render phase (e.g. `preferReducedMotion.current = ...`) is an anti-pattern that violates React's strict mode and the `react-hooks/refs` linting rule. While standard Webpack builds might tolerate it with warnings, Next.js Turbopack (v16+) enforces strict Ecmascript parsing which can cause the build to fail entirely with a "cannot reassign to a variable declared with const" error during optimization.
**Action:** Refactor `useRef` assignments during the render phase to use `useState` instead (e.g., `const [value, setValue] = useState(...)`), and handle updates to that state cleanly via `useEffect` hooks, ensuring strict compliance with React's rendering lifecycle and Next.js Turbopack requirements.
