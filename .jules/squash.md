## 2025-03-08 - Fixed Silent Failures in updateStreak Server Actions

**Learning:** Next.js Server Actions return objects containing errors instead of throwing them, which caused chained `.catch()` blocks in client components to be completely ignored. This resulted in silent logic failures across the app where errors were expected to trigger fallback behavior or toasts.
**Action:** Always wrap server actions in `async` functions when calling them from client components or `useEffect` hooks, `await` the response, explicitly check for `.error`, and use `try/catch` strictly for actual network failures.
