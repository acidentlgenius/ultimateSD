🪲 Squash: Fix react-hooks/refs linting error in AdaptiveCoachDemo

💥 The Bug:
A linting error `react-hooks/refs` was being thrown due to accessing `preferReducedMotion.current` during the render phase in `AdaptiveCoachDemo.tsx`. This violates React's rules and can cause the component not to update as expected during concurrent rendering.

🔍 Root Cause:
The `preferReducedMotion` flag, implemented as a `useRef`, was conditionally influencing the render output (`const shown = preferReducedMotion.current ? ...`) and the initial state of the Framer Motion `motion.div`. `useRef.current` should not be read during rendering.

🛠️ The Fix:
Changed `preferReducedMotion` from a `useRef` to a `useState` hook. The `useEffect` that checks for `(prefers-reduced-motion: reduce)` now calls `setPreferReducedMotion(...)`, and the rendering logic correctly reads the state value instead of the ref current property. Also added `preferReducedMotion` to the relevant `useEffect` dependency array.

🛡️ Prevention:
Added a new regression test `AdaptiveCoachDemo.test.tsx` that simulates `matchMedia` returning `true` for reduced motion to ensure the component mounts successfully without throwing errors and correctly applies the reduced motion preference.
