1. **Fix `useRef` access during render in `AdaptiveCoachDemo.tsx`**
   - In `ultimate-sd/src/components/landing/AdaptiveCoachDemo.tsx`, `preferReducedMotion.current` is accessed during the render phase (lines 76 and 156), which violates the `react-hooks/refs` linting rule and can cause issues with concurrent rendering.
   - I will change `const preferReducedMotion = useRef(false);` to `const [preferReducedMotion, setPreferReducedMotion] = useState(false);`.
   - I will update the `useEffect` that sets the value to use `setPreferReducedMotion` instead of mutating the `.current` property.
   - I will add `preferReducedMotion` to the dependency array of the second `useEffect` that resets the clock (line 50), and remove `.current` accesses.

2. **Run tests and linting**
   - I will run `pnpm lint` and `pnpm test run` to ensure the ESLint error is resolved and no regressions have been introduced.

3. **Complete pre-commit steps and submit**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
