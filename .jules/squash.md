## 2024-06-20 - localStorage JSON Parsing Vulnerability

**Learning:** When retrieving JSON objects from `localStorage` in React applications, calling `JSON.parse` without a try/catch block creates a critical vulnerability. If the stored data becomes corrupted (e.g., from an interrupted write or browser state manipulation), the component will throw a synchronous exception during render, leading to a complete unhandled crash of the React tree (white screen of death). This is a common and silent failure path for frontends storing complex state locally.

**Action:** Whenever implementing or auditing state persistence via `localStorage`, always wrap `JSON.parse` in a `try...catch` block. The catch block must include a safe fallback mechanism, primarily `localStorage.removeItem(key)` to clear the corrupted state, and returning a valid default value (like an empty array or object) to ensure the application can still boot cleanly. Avoid silent empty catch blocks.
