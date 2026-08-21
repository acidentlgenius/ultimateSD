## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2026-08-03 - Accessible Custom Problem Return Button\n**Learning:** The 'ArrowLeft' return button in the custom problem page lacked a descriptive label for screen readers.\n**Action:** Add `aria-label` and `title` to icon-only buttons to enhance accessibility and user experience.
