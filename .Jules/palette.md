## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-06-25 - Accessible Icon-Only Buttons Part 2
**Learning:** Found several instances of icon-only buttons with `aria-label`s missing `title`s or vice versa. The combination of both makes it easier for sighted users through tooltip hover effects as well as screen readers.
**Action:** Always ensure that icon-only buttons have BOTH `aria-label` and `title` attributes.
