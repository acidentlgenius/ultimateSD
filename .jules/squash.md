## 2025-02-28 - React ref accessed during render

**Learning:** When debugging React components, accessing a `useRef`'s `.current` value directly during the render phase (e.g., in `initial={{...}}` or for filtering arrays) violates React's rules for refs. It can cause silent state synchronization bugs where the UI fails to update when the ref mutates, or causes "Cannot access ref value during render" ESLint errors.

**Action:** Whenever a component needs to render differently based on an asynchronous value initialized on mount (like `window.matchMedia`), use `useState` initialized via `useEffect` rather than mutating a `useRef`. Always ensure the newly created state variable is added to the dependency arrays of any `useEffect` or `useMemo` hooks that reference it.
