## 2024-XX-XX - Fix lint error in AdaptiveCoachDemo

**Learning:** Reading a `useRef`'s `.current` property during the React render phase violates the `react-hooks/refs` linting rule and can break concurrent rendering. It can cause a component not to update as expected.

**Action:** If a value needs to conditionally influence the render output, implement it using `useState` instead, and ensure it is added to all relevant `useEffect` dependency arrays to prevent stale closures. Never read `ref.current` during rendering.
## 2025-02-21 - Fix lint error in AdaptiveCoachDemo

**Learning:** Reading a `useRef`'s `.current` property during the React render phase violates the `react-hooks/refs` linting rule and can break concurrent rendering. It can cause a component not to update as expected.

**Action:** If a value needs to conditionally influence the render output, implement it using `useState` instead, and ensure it is added to all relevant `useEffect` dependency arrays to prevent stale closures. Never read `ref.current` during rendering.
