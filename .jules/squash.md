## 2026-06-20 - Floating Promises with Next.js Server Actions

**Learning:** Next.js Server Actions in this project (like `updateStreak`) are designed to return error objects (e.g., `{ error: 'message' }`) rather than throwing exceptions. This means that appending `.catch(console.error)` to them in a `useEffect` will *never* catch the application-level errors, creating silent failures on the client side while appearing handled.

**Action:** Always verify the actual return type of a Next.js Server Action. When calling async functions inside `useEffect`, use an inner `async() => {}` wrapper to properly `await` the result, check for returned error objects (e.g., `result.error`), and wrap the entire call in a `try/catch` block to handle true network or execution failures.
