💡 What:
Fixed a React hook linting error (`react-hooks/refs`) in `AdaptiveCoachDemo.tsx` where a `useRef`'s `.current` property (`preferReducedMotion.current`) was being accessed directly during the render phase.

🎯 Why:
Accessing `.current` during the render phase violates React's rules and can lead to bugs in concurrent rendering because refs do not trigger re-renders when mutated. This issue caused the GitHub Actions CI check to fail during `pnpm lint`.

📸 Before/After:
Before: `preferReducedMotion` was a `useRef` and was accessed as `preferReducedMotion.current` inside the render body.
After: Converted `preferReducedMotion` to a `useState` initialized to `false` (the same initial value), and updated it safely inside a `useEffect` using `window.matchMedia`. Render phase code now reads from the state variable safely.

♿ Accessibility:
Maintains the exact same behavior of respecting the user's `prefers-reduced-motion` operating system settings, but with a React-compliant implementation.
