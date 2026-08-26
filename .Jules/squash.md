
## 2024-05-27 - [Title]

**Learning:** Reading from a React `useRef` object (`ref.current`) directly inside the main render path causes a "Cannot access refs during render" error from the Next.js `eslint-plugin-react-hooks`. Since React refs do not trigger re-renders when mutated, relying on them for conditional rendering blocks means the component's UI can easily drift from the underlying state, breaking hydration and breaking concurrent rendering.

**Action:** Replace `useRef` hooks with `useState` hooks when the tracked value is required for rendering markup. Initialize the state cautiously (e.g., in a `useEffect` if relying on client-only APIs like `window.matchMedia`) to prevent SSR hydration mismatches.
