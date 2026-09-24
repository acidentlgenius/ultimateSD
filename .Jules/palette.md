## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-05-18 - Interactive Quiz Options Accessibility
**Learning:** Using `div` with `onClick` for quiz options completely breaks keyboard navigation and screen reader support, leaving the quiz inaccessible to users relying on these tools.
**Action:** Always use native semantic `<button>` tags with `type="button"` and ensure proper focus outlines and `disabled` states for interactive options to ensure full accessibility out-of-the-box.
