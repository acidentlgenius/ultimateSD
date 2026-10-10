## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.

## 2024-05-30 - Added ARIA labels to rich text editor toolbar
**Learning:** Rich text editor formatting toolbars are a common place where accessibility is missed due to the visual nature of the icons and reliance on third party libraries that do not enforce a11y standards.
**Action:** When working with rich text editors (like Tiptap), always ensure that custom toolbar buttons have both `aria-label` and `title` attributes so they are accessible to screen readers and have tooltips for sighted users.
