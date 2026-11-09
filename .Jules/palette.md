## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.

## 2025-03-08 - Added aria-labels and native title attributes
**Learning:** The `BlogEditor` component's toolbar contained dozens of `size="icon-sm"` buttons lacking native tooltips and ARIA labels, representing a significant accessibility blind spot in the rich text editing experience.
**Action:** Always verify that interactive elements, particularly tightly grouped sets of toolbars or navigation actions using `size="icon"` or `size="icon-sm"`, have corresponding native `title`s and `aria-label`s.
