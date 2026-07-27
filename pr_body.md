💡 What
Added `aria-label`, `title`, and `aria-pressed` attributes to the Grid and List view toggle buttons in the `ProblemFilterBar` component. Also mocked out `isLaunchOfferActive` in tests to prevent failures due to hardcoded deadlines.

🎯 Why
Icon-only buttons rely on standard SVGs without native descriptive text. Screen readers and users navigating via keyboard need explicit descriptions to understand the buttons' purpose and their active states.

📸 Before/After
N/A (Invisible accessibility improvement)

♿ Accessibility
- Added descriptive `aria-label`s to clarify button actions (e.g. "Grid view", "List view").
- Added native tooltips using `title` for mouse hover context.
- Implemented `aria-pressed` state to indicate which view mode is currently active.
