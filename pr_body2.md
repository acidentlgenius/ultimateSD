💥 The Bug: CI checks failed due to an ESLint error `react-hooks/refs`: `Cannot access refs during render`. The component `AdaptiveCoachDemo.tsx` was accessing `preferReducedMotion.current` directly in the render function.
🔍 Root Cause: React refs are mutable values that are not part of the component's state. Reading a ref during render breaks concurrent rendering assumptions and fails ESLint rules.
🛠️ The Fix: Changed `preferReducedMotion` from a `useRef` to a `useState` variable initialized to false, which is then updated inside the `useEffect` that checks the user's motion preferences.
🛡️ Prevention: The ESLint rule `react-hooks/refs` successfully caught this issue before production deployment. The fix complies with React's best practices for state vs refs.
