## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-10-30 - Added ARIA labels and titles to icon-only buttons
**Learning:** Found multiple icon-only `Button` components missing `aria-label` or `title` across the app (`TimerWidget`, `PracticeUI`, `HelpAssistant`, `WhatsNewNotifier`, `AdaptiveCoachDemo`, `custom/page.tsx`).
**Action:** Always verify icon-only buttons (`size="icon"`) include `aria-label` for screen readers and `title` for visual tooltips.
