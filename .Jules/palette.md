## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-03-08 - Tooltips on Icon-Only Buttons
**Learning:** Found several icon-only buttons that correctly had `aria-label`s for screen readers but lacked native HTML `title` attributes, making them inaccessible to sighted users who rely on hover tooltips.
**Action:** Ensure icon-only buttons implement both `aria-label` and `title` to provide comprehensive accessibility and usability across all user groups.
