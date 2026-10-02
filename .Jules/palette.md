## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-10-02 - Add aria-current to navigation steps

**Learning:** Missing `aria-current` on step indicators makes it impossible for screen reader users to understand their current progress in a multi-step flow, which is crucial for navigation components.

**Action:** Always add `aria-current="step"`, `aria-current="page"`, or `aria-current="true"` to the active item in navigation lists and stepper components.
