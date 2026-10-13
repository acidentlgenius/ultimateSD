## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-05-24 - Accessible Rich Text Editor Buttons
**Learning:** Found that custom toolbar buttons in rich text editors (like Tiptap) were missing aria-labels and titles, making them inaccessible to screen readers.
**Action:** Always ensure that custom toolbar buttons (e.g., icon-only formatting buttons) have both `aria-label` and `title` attributes so they are accessible to screen readers and provide clear tooltips for sighted users.
