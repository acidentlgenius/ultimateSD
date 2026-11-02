💥 The Bug: Accessing `preferReducedMotion.current` during the render phase in `AdaptiveCoachDemo.tsx` causes a linting error (`react-hooks/refs`) and breaks concurrent React rendering.
🔍 Root Cause: React refs (`useRef`) are mutable and not tracked by the React rendering system, so accessing their `.current` value during render is not allowed.
🛠️ The Fix: Changed `preferReducedMotion` to use `useState` instead of `useRef`. Added `preferReducedMotion` to the `useEffect` dependency array where appropriate.
🛡️ Prevention: Added regression tests to `AdaptiveCoachDemo.test.tsx` to verify the component renders without crashing and handles `preferReducedMotion` properly.
