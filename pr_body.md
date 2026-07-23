💡 What
Added `aria-label` and `title` attributes to the grid and list view toggle buttons in the `ProblemFilterBar` component. Also mocked out a time-dependent utility function for Vitest.

🎯 Why
These buttons use Lucide SVG icons (`LayoutGrid` and `List`) without any descriptive text. Since they act as icon-only interactive controls, adding an accessible name via `aria-label` is required for screen reader users to understand their purpose, and `title` provides a helpful hover tooltip for sighted users. The Vitest mock allows tests to run successfully after the launch offer deadline passes.

📸 Before/After
Before: The grid/list layout buttons lacked accessible names and tooltips.
After: Hovering over the buttons displays "Grid view" and "List view", and screen readers will announce these labels correctly.

♿ Accessibility
- Added descriptive `aria-label`s to ensure icon-only buttons are announced by screen readers.
- Added `title`s to provide native browser tooltips on hover, aiding all users in understanding the control's function.
