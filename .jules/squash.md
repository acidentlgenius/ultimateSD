## YYYY-MM-DD - Fix React State and Linter CI Failures

**Learning:** Using `useRef` to store values that directly determine component rendering (like toggling animations or conditional rendering) violates React's strict mode rules because refs don't trigger re-renders. This causes "Cannot access refs during render" errors. Furthermore, unused `eslint-disable` directives are flagged as warnings, which causes CI to fail in strict environments.

**Action:** Always convert `useRef` to `useState` when the value is needed during the render phase. When doing so, remember to update the dependency arrays of `useEffect` or `useCallback` hooks that relied on the old ref. Additionally, proactively remove `eslint-disable` comments when they are no longer applicable to prevent CI failures.
