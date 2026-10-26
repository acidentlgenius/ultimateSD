🐛 Squash: Fix React 19 Ref warnings in AdaptiveCoachDemo.tsx

💥 The Bug:
The `AdaptiveCoachDemo.tsx` component was reading `preferReducedMotion.current` during its render phase. This violates React's pure rendering rules and causes strict linting errors (`react-hooks/refs`) under newer versions of React, as refs should only be read outside the render phase (e.g., in event handlers or effects) to avoid unexpected UI states during concurrent rendering.

🔍 Root Cause:
The developer used a `useRef` to store the initial result of a `window.matchMedia` query (to avoid SSR hydration errors) but then read that ref directly within the JSX to conditionally apply Framer Motion animations. Because refs do not trigger re-renders, the value cannot safely dictate what is rendered.

🛠️ The Fix:
Migrated `preferReducedMotion` from a `useRef` to a standard React `useState` variable initialized to `false`. The state is then securely updated inside a mounting `useEffect` with the result of the `window.matchMedia` check. All dependency arrays for timing effects were updated to include `preferReducedMotion` correctly.

🛡️ Prevention:
The linter has been run (`pnpm lint`) to confirm that the `react-hooks/refs` warning is completely resolved.
