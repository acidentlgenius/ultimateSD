🐛 Squash: Fix test and JSON parse crash bugs

💥 The Bug:
- React act() warnings trigger when timers advance and update debounced component state in tests without an act wrapper.
- Application-level crashes happen when `JSON.parse` is hit with invalid input from AI responses or `localStorage`.

🔍 Root Cause:
- Unhandled `JSON.parse` calls outside a try/catch block will throw hard exceptions and potentially crash applications or tests.
- React Testing library requires any timer advances that cause React state updates to be wrapped in an `act()` block.

🛠️ The Fix:
- Added the `act()` wrappers around `vi.advanceTimersByTimeAsync` in `DiagramCanvas.test.tsx`.
- Replaced `JSON.parse` with safe try/catch wrapper in `session-storage.ts` and `langgraph.ts`.

🛡️ Prevention:
- Tested to ensure warnings no longer occur and that invalid JSON is now safely ignored instead of crashing.
