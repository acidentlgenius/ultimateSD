💥 The Bug: CI checks were failing during the `pnpm lint` step due to two issues:
1. `AdaptiveCoachDemo.tsx` was accessing a `useRef`'s `.current` value during the React render phase, which violates React's strict mode and triggered a `react-hooks/refs` error.
2. Several components (`ProblemIntrosPanel.tsx`, `StepByStepChat.tsx`, and `TimerWidget.tsx`) contained unused `eslint-disable` directives (like `eslint-disable-next-line react-hooks/exhaustive-deps`) that the linter correctly flagged as warnings, causing a strict mode failure.

🔍 Root Cause:
1. In `AdaptiveCoachDemo.tsx`, `preferReducedMotion.current` was being read directly in the main component body (e.g., `const shown = preferReducedMotion.current ? ...`) and in render props. Refs should only be accessed in event handlers or effects.
2. The unused `eslint-disable` comments were likely left over from previous refactors where dependencies were updated, but the suppressions were not removed.

🛠️ The Fix:
1. Converted `preferReducedMotion` from a `useRef` to a `useState` variable in `AdaptiveCoachDemo.tsx`. It is properly initialized as `false` and then updated inside the `useEffect` that checks `window.matchMedia`. The state variable is now safely read during render and correctly included in dependency arrays.
2. Removed the dangling, unused `eslint-disable` and `eslint-disable-next-line` comments across the affected components.

🛡️ Prevention: Always use `useState` when a value needs to be read during a component's render phase to dictate UI changes. Rely on local `pnpm lint` runs before pushing to ensure no unused suppression comments are left behind.
