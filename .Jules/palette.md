## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-03-08 - Tooltips and ARIA for Icon-only Buttons
**Learning:** Found multiple instances of `Button size="icon"` missing `aria-label` or `title` across several components (`TimerWidget`, `PracticeUI`, `WhatsNewNotifier`, `HelpAssistant`, `custom/page.tsx`). While some had `aria-label`, they were missing `title` which provides important native browser tooltips for sighted users.
**Action:** When implementing or fixing icon-only buttons, always ensure BOTH `aria-label` (for screen readers) and `title` (for native tooltips) are provided to maximize accessibility for all users.
