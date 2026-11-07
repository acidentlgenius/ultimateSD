## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-03-08 - Toolbar Icon Buttons Accessibility
**Learning:** Found that custom toolbars composed of multiple `size="icon-sm"` buttons (like the `BlogEditor` component) are prone to missing `aria-label` and `title` attributes across the entire group, severely impacting screen reader navigation and discoverability of editor features.
**Action:** When inspecting rich text or custom editors, systematically verify that every icon-only control within a toolbar group has both a descriptive `aria-label` and a visible `title` tooltip.
