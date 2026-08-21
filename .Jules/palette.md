## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2026-08-04 - Accessible Icon Buttons and Valid HTML Nesting
**Learning:** Found an icon-only back button in the custom problem page that lacked an accessible name and was incorrectly nested as `<Link><Button></Button></Link>`.
**Action:** Always wrap Next.js `<Link>` elements with `<Button asChild>` and ensure icon-only buttons have descriptive `aria-label` and `title` attributes.
