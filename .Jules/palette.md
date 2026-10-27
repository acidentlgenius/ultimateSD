## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.

## 2024-10-27 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons without `aria-label` and `title` attributes are a common accessibility issue in UI components, impacting both screen reader users (who need the label) and sighted users (who need the tooltip).
**Action:** Always verify that icon-only buttons (like those with `size="icon"` or `size="icon-sm"`) have explicitly defined `aria-label` and `title` attributes.
