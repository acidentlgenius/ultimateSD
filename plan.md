CI failed because I introduced an ESLint violation or one existed that wasn't caught locally but caught in CI.

```
/home/runner/work/ultimateSD/ultimateSD/ultimate-sd/src/components/landing/AdaptiveCoachDemo.tsx
   76:17  error  Error: Cannot access refs during render
```

This violates the memory rule:
> Reading `useRef` values during a React component's render phase is an anti-pattern that violates React strict mode (triggering `react-hooks/refs` lint errors) and causes stale closures. Replace these refs with `useState` and include the state variable in relevant `useEffect` dependency arrays.
> When refactoring a React component to change a `useRef` to a `useState`, you must audit and update the dependency arrays of any `useEffect` or `useCallback` hooks that reference the new state variable to prevent stale closures and functional regressions.

Let's fix `AdaptiveCoachDemo.tsx` to use `useState` for `preferReducedMotion`.

```tsx
  const [preferReducedMotion, setPreferReducedMotion] = useState(false);

  useEffect(() => {
    setPreferReducedMotion(
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);
```

Also, there are warnings in `StepByStepChat.tsx`, `TimerWidget.tsx`, etc., about `react-hooks/exhaustive-deps`. But let's fix the error first, which caused the build to fail. Wait, the CI fails on warnings if `--max-warnings=0` is set or if there are `eslint-disable` warnings?
Wait, there are unused eslint-disable directives!
```
  48:5  warning  Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
    2:1  warning  Unused eslint-disable directive (no problems were reported from 'react-hooks/refs')
```

I will fix `AdaptiveCoachDemo.tsx` first.
