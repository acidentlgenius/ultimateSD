## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2025-02-14 - Icon Button Accessibility

**Learning:** Sighted users rely on tooltips just as much as screen readers rely on ARIA labels for icon-only buttons. The native `title` attribute provides an easy, standard way to implement these tooltips without external UI dependencies.
**Action:** When adding or verifying `aria-label` on `Button size="icon"`, always check for and add a corresponding `title` attribute to ensure it is accessible to both screen readers and sighted users.
