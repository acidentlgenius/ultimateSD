## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-10-21 - Missing ARIA Labels on Icon Buttons
**Learning:** It's common to miss `aria-label` and `title` on icon-only back navigation buttons (e.g., `<ArrowLeft>`). These attributes are critical for screen readers and tooltips.
**Action:** Always verify icon-only buttons include `aria-label` and `title` to ensure keyboard accessibility and visual guidance.
