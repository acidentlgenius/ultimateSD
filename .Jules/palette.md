## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-03-08 - Accessible Rich Text Editor Toolbar Buttons
**Learning:** Icon-only buttons used within rich text editor toolbars (like Tiptap) were missing `aria-label`s and `title`s, which makes formatting options opaque to screen reader users and non-obvious to sighted users since they lack visual tooltips.
**Action:** Always verify that interactive elements, especially icon-only buttons in custom toolbars, include descriptive `aria-label`s for screen readers and `title` attributes for native hover tooltips.
## 2024-03-08 - UseState for preferReducedMotion
**Learning:** `window.matchMedia` values used to condition React rendering or animations (like `prefers-reduced-motion`) must be stored in `useState`, not `useRef`. Accessing a `useRef`'s `.current` value during the render phase causes `react-hooks/refs` linting errors and functional bugs.
**Action:** Always use `useState` for environment state that dictates UI rendering, and explicitly include it in dependency arrays to prevent stale closures.
