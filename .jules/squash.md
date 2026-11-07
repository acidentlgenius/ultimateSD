## 2024-05-18 - Case Sensitive Email Authentication Vulnerability

**Learning:** PostgreSQL uses case-sensitive string collation by default. When Prisma's `findUnique` is used with an exact `email` match for user lookups, it can lead to multiple accounts being created for the same user (e.g., `user@example.com` and `User@example.com`). This fragments the authentication state and can cause sign-in failures or unintended session state bleed depending on which record `findFirst` selects during auth.

**Action:** Always replace `findUnique` email lookups with `findFirst` using `{ equals: email, mode: 'insensitive' }` across all authentication and internal user-fetching routes (e.g. signup, auth login, password reset, progress sync).

## 2026-06-30 - [Silent Loop Failure via LocalStorage Parsing Error]

**Learning:** When iterating over a collection (like `localStorage` keys) and parsing their contents, wrapping the *entire* loop in a `try/catch` block creates a severe vulnerability: a single corrupted item will throw an error, abort the entire loop, and silently hide all subsequent valid items. In `getAllSessions`, this meant one corrupt session key made the system report *zero* total sessions for a user, effectively wiping their history until the bad key was manually cleared.

**Action:** Always scope `try/catch` blocks tightly around the risky operation *inside* the iteration, rather than wrapping the whole loop. When catching parsing errors for stored user state, proactively remove the corrupted key (`localStorage.removeItem`) so the system can self-heal, rather than repeatedly failing on the same bad data.

## 2024-06-20 - localStorage JSON Parsing Vulnerability

**Learning:** When retrieving JSON objects from `localStorage` in React applications, calling `JSON.parse` without a try/catch block creates a critical vulnerability. If the stored data becomes corrupted (e.g., from an interrupted write or browser state manipulation), the component will throw a synchronous exception during render, leading to a complete unhandled crash of the React tree (white screen of death). This is a common and silent failure path for frontends storing complex state locally.

**Action:** Whenever implementing or auditing state persistence via `localStorage`, always wrap `JSON.parse` in a `try...catch` block. The catch block must include a safe fallback mechanism, primarily `localStorage.removeItem(key)` to clear the corrupted state, and returning a valid default value (like an empty array or object) to ensure the application can still boot cleanly. Avoid silent empty catch blocks.

## 2026-06-20 - Floating Promises with Next.js Server Actions

**Learning:** Next.js Server Actions in this project (like `updateStreak`) are designed to return error objects (e.g., `{ error: 'message' }`) rather than throwing exceptions. This means that appending `.catch(console.error)` to them in a `useEffect` will *never* catch the application-level errors, creating silent failures on the client side while appearing handled.

**Action:** Always verify the actual return type of a Next.js Server Action. When calling async functions inside `useEffect`, use an inner `async() => {}` wrapper to properly `await` the result, check for returned error objects (e.g., `result.error`), and wrap the entire call in a `try/catch` block to handle true network or execution failures.
## 2026-06-23 - [Cloud Synchronization and Local Storage Hydration Race Conditions]

**Learning:** When transitioning from a purely synchronous  hydration pattern to an asynchronous cloud-sync pattern in a React component, relying blindly on `useSession()` and immediate `useEffect` triggers introduces severe race conditions. Specifically, if a component writes to the database whenever its local state changes, and the initial cloud fetch is delayed or skipped because the session is still loading, the component may default to an empty local state and immediately upload that empty state to the cloud, permanently overwriting the user's progress. Furthermore, using slugs instead of CUIDs for foreign key relations in Prisma upsert commands will cause 500 errors.

**Action:**
1. Always explicitly check `sessionStatus === 'loading'` and return early in initialization `useEffect`s to prevent premature execution.
2. Ensure cloud write/sync `useEffect`s are strictly guarded by a flag (e.g., `sessionRestored`) that is *only* set to `true` after the asynchronous load attempt has fully resolved.
3. Always debounce backend writes (e.g., using `setTimeout` within the `useEffect` cleanup pattern) when syncing local interactive state to prevent DDoS-ing the database.
4. Always verify database schemas (like Prisma relations) to ensure the correct ID type (e.g., CUID vs Slug) is passed to foreign key queries.
## 2024-06-25 - [Cloud Synchronization and Local Storage Hydration Race Conditions]

**Learning:** When transitioning from a purely synchronous `localStorage` hydration pattern to an asynchronous cloud-sync pattern in a React component, relying blindly on `useSession()` and immediate `useEffect` triggers introduces severe race conditions. Specifically, if a component writes to the database whenever its local state changes, and the initial cloud fetch is delayed or skipped because the session is still loading, the component may default to an empty local state and immediately upload that empty state to the cloud, permanently overwriting the user's progress. Furthermore, using slugs instead of CUIDs for foreign key relations in Prisma upsert commands will cause 500 errors.

**Action:**
1. Always explicitly check `sessionStatus === 'loading'` and return early in initialization `useEffect`s to prevent premature execution.
2. Ensure cloud write/sync `useEffect`s are strictly guarded by a flag (e.g., `sessionRestored`) that is *only* set to `true` after the asynchronous load attempt has fully resolved.
3. Always debounce backend writes (e.g., using `setTimeout` within the `useEffect` cleanup pattern) when syncing local interactive state to prevent DDoS-ing the database.
4. Always verify database schemas (like Prisma relations) to ensure the correct ID type (e.g., CUID vs Slug) is passed to foreign key queries.
## 2025-02-21 - Dangling references in list storage pattern

**Learning:** When storing individual items in `localStorage` alongside a master "list" key (e.g. `saved-designs-list` containing references), a corruption in the individual item could lead to state inconsistency. When the item fails to parse, clearing only the item key leaves a dangling reference in the master list, causing "ghost" UI entries.

**Action:** Whenever implementing or debugging a manual `localStorage` list-and-item pattern, always verify that deleting or handling a corrupted item also correctly removes its reference from the master list index.

## 2026-06-24 - [Floating Promise with Next.js Server Actions]

**Learning:** Next.js Server Actions in this project (like `syncSessionState`) are designed to return error objects (e.g., `{ error: 'message' }`) rather than throwing exceptions. This means that appending `.catch(console.error)` to them in a `useEffect` will *never* catch the application-level errors, creating silent failures on the client side while appearing handled.

**Action:** Always verify the actual return type of a Next.js Server Action. When calling async functions inside `useEffect` or timeouts, use an inner `async() => {}` wrapper to properly `await` the result, check for returned error objects (e.g., `result.error`), and wrap the entire call in a `try/catch` block to handle true network or execution failures.

## 2026-06-25 - [Memory Leaks with requestAnimationFrame in React]

**Learning:** When using `requestAnimationFrame` inside a React `useEffect` hook for custom animations, failing to capture the returned animation frame ID and clean it up via `cancelAnimationFrame` on component unmount causes severe memory leaks. The animation loop continues running in the background, attempting to update state on an unmounted component, which pollutes the JS heap and triggers React warnings.

**Action:** Always capture the ID returned by `requestAnimationFrame` (and any associated `setTimeout` wrappers) in variables initialized to `0`. In the `useEffect` cleanup function, explicitly call `cancelAnimationFrame(id)` and `clearTimeout(id)` to ensure all scheduled updates are safely aborted.

## 2026-06-28 - [Memory Leaks with setTimeout inside intervals in React]

**Learning:** When using `setTimeout` inside an interval (like `setInterval`) within a React `useEffect` hook, the interval cleanup function `clearInterval` only stops future executions of the interval, but it does NOT cancel any `setTimeout` calls that have already been scheduled. This can lead to state updates on unmounted components and memory leaks if the component unmounts before the nested timeouts fire.

**Action:** Always track all active `setTimeout` IDs in a persistent structure (like a `Set`) within the effect. In the `useEffect` cleanup function, iterate through the tracked timeout IDs and call `clearTimeout` on each one in addition to calling `clearInterval`. Remember to remove timeout IDs from the tracked set once they have successfully executed to avoid memory leaks from an ever-growing array or set over long sessions.

## 2026-06-30 - [Memory Leaks with setTimeout inside intervals and useEffect dependency triggers in React]

**Learning:** When using dynamic timers (`setInterval`, `setTimeout`) inside a `useEffect` that frequently re-runs due to dependency changes (like crawler state variables changing), clearing the timeouts in that same `useEffect`'s cleanup function will prematurely kill those timeouts during re-renders, breaking the logic (e.g. killing timeouts that were meant to simulate sequential crawler steps).

**Action:** Store timeout IDs in a `useRef` (e.g., `useRef(new Set<NodeJS.Timeout>())`) and clear them exclusively in a separate unmount-only `useEffect` (with an empty `[]` dependency array) to prevent memory leaks while preserving asynchronous functionality across state-induced re-renders.

## 2026-06-31 - [Floating Promises with Next.js Server Actions in StepFeedbackPanel]

**Learning:** Next.js Server Actions return error objects (e.g., `{ error: 'message' }`) instead of throwing exceptions. When calling them as floating promises using `.catch()` inside side effects like `StepFeedbackPanel`'s `useEffect`, the `.catch` block never triggers on logical server errors. This leads to silent failures and prevents proper error logging.

**Action:** Always wrap async Server Action calls in an inner async function inside the `useEffect`. Await the result, explicitly check for returned error objects (e.g., `if (result?.error)`), and log them properly. Ensure tests cover both network errors (rejected promises) and logical server errors (resolved error objects).
