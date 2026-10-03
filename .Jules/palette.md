## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.

## 2024-10-02 - Missing loading feedback on async buttons
**Learning:** Certain async action buttons (like the `Send` button in RESTExplorer and `Run Query` in GraphQLPlayground) correctly disabled themselves via `isLoading` but lacked visual loading feedback, leaving users wondering if the action registered.
**Action:** Always pair `disabled={isLoading}` states with a visual loading indicator (e.g., `Loader2` with `animate-spin`) on action buttons to provide immediate, clear feedback.
