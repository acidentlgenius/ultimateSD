## 2024-10-06 - Fixing vitest logs

**Learning:** When vitest tests trigger react state updates in timers, they generate an act(...) warning in stderr. Also, console.error and console.warn calls inside tests pollute stderr. Failing to wrap async timer advancement that triggers a state update in an act block generates react warnings in standard error.

**Action:** Ensure vitest tests are wrapped in an act block from @testing-library/react if they invoke vi.advanceTimersByTimeAsync and that triggers a react state update. Silence expected errors inside unit tests using vi.spyOn(console, 'error').mockImplementation(() => {});
