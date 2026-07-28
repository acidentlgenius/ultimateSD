## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.

## 2024-07-28 - Icon Button HTML Nesting
**Learning:** Next.js <Link> elements wrapped around Radix <Button> components render invalid HTML and cause poor screen reader experiences.
**Action:** Always use the <Button asChild><Link> structure for icon-only navigation buttons.
