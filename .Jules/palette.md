## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-10-11 - Add ARIA labels and titles to icon-only buttons
**Learning:** Found that formatting buttons in the blog editor (Heading 2, Bold, Italic, etc.) were missing ARIA labels and titles, making them inaccessible to screen readers and difficult to understand without tooltips. This is a common accessibility issue for icon-only buttons.
**Action:** Always ensure icon-only buttons (`<Button size="icon">` or similar) have descriptive `aria-label` and `title` attributes to improve accessibility and provide helpful tooltips for sighted users.
