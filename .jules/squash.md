## $(date +%Y-%m-%d) - [Silent Loop Failure via LocalStorage Parsing Error]

**Learning:** When iterating over a collection (like `localStorage` keys) and parsing their contents, wrapping the *entire* loop in a `try/catch` block creates a severe vulnerability: a single corrupted item will throw an error, abort the entire loop, and silently hide all subsequent valid items. In `getAllSessions`, this meant one corrupt session key made the system report *zero* total sessions for a user, effectively wiping their history until the bad key was manually cleared.

**Action:** Always scope `try/catch` blocks tightly around the risky operation *inside* the iteration, rather than wrapping the whole loop. When catching parsing errors for stored user state, proactively remove the corrupted key (`localStorage.removeItem`) so the system can self-heal, rather than repeatedly failing on the same bad data.

## 2024-06-20 - localStorage JSON Parsing Vulnerability

**Learning:** When retrieving JSON objects from `localStorage` in React applications, calling `JSON.parse` without a try/catch block creates a critical vulnerability. If the stored data becomes corrupted (e.g., from an interrupted write or browser state manipulation), the component will throw a synchronous exception during render, leading to a complete unhandled crash of the React tree (white screen of death). This is a common and silent failure path for frontends storing complex state locally.

**Action:** Whenever implementing or auditing state persistence via `localStorage`, always wrap `JSON.parse` in a `try...catch` block. The catch block must include a safe fallback mechanism, primarily `localStorage.removeItem(key)` to clear the corrupted state, and returning a valid default value (like an empty array or object) to ensure the application can still boot cleanly. Avoid silent empty catch blocks.

## 2026-06-20 - Floating Promises with Next.js Server Actions

**Learning:** Next.js Server Actions in this project (like `updateStreak`) are designed to return error objects (e.g., `{ error: 'message' }`) rather than throwing exceptions. This means that appending `.catch(console.error)` to them in a `useEffect` will *never* catch the application-level errors, creating silent failures on the client side while appearing handled.

**Action:** Always verify the actual return type of a Next.js Server Action. When calling async functions inside `useEffect`, use an inner `async() => {}` wrapper to properly `await` the result, check for returned error objects (e.g., `result.error`), and wrap the entire call in a `try/catch` block to handle true network or execution failures.
