## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.

## 2024-03-08 - Rich Text Editor Toolbar Accessibility
**Learning:** Discovered that rich text editor toolbars (like in `BlogEditor.tsx`) frequently use icon-only buttons for formatting options, but often lack `aria-label`s, rendering the tools inaccessible to screen reader users.
**Action:** Always verify that every interactive button in toolbar or menu components, especially those utilizing `size="icon-sm"`, includes descriptive `aria-label` and `title` attributes.
