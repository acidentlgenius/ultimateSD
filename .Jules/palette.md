## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.

## 2025-03-08 - Accessible Dialogs
**Learning:** Radix UI `Dialog` components will throw accessibility warnings (and violate WAI-ARIA specs) if they lack a `DialogDescription`. We discovered this pattern in several modals like FeedbackModal and ExcalidrawEmbedModal.
**Action:** Always ensure `<DialogDescription>` is imported and included inside `<DialogHeader>`. If no visible description is needed, use `<DialogDescription className="sr-only">`.
