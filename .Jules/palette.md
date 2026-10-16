## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-03-08 - Accessible Rich Text Editor Toolbar Buttons
**Learning:** Icon-only buttons used within rich text editor toolbars (like Tiptap) were missing `aria-label`s and `title`s, which makes formatting options opaque to screen reader users and non-obvious to sighted users since they lack visual tooltips.
**Action:** Always verify that interactive elements, especially icon-only buttons in custom toolbars, include descriptive `aria-label`s for screen readers and `title` attributes for native hover tooltips.
## 2024-03-08 - UseState for preferReducedMotion
**Learning:** `window.matchMedia` values used to condition React rendering or animations (like `prefers-reduced-motion`) must be stored in `useState`, not `useRef`. Accessing a `useRef`'s `.current` value during the render phase causes `react-hooks/refs` linting errors and functional bugs.
**Action:** Always use `useState` for environment state that dictates UI rendering, and explicitly include it in dependency arrays to prevent stale closures.
## 2024-03-08 - Safe JSON.parse in localStorage loops
**Learning:** Wrapping an entire loop in a `try/catch` block when iterating over `localStorage` items (like sessions) is a brittle pattern. If one item is corrupted or unparseable, the error halts the entire loop, effectively causing the application to "forget" all subsequent valid items.
**Action:** When parsing local storage items iteratively, always place the `try/catch` *inside* the loop so corrupted items can be individually logged, discarded, or ignored without aborting the loop for valid items.
## 2024-03-08 - Accessible Dialog Descriptions
**Learning:** Radix UI Dialog components (`DialogContent`) must have an accessible description (`DialogDescription` or `aria-describedby={undefined}`) to satisfy screen readers and prevent React warnings during tests.
**Action:** When creating or modifying modals using `@/components/ui/dialog`, always include a `<DialogDescription className="sr-only">...</DialogDescription>` inside the `<DialogHeader>` if a visible description is not necessary.
## 2024-03-08 - Graceful DB Failures on Public Routes
**Learning:** Functions that query the database (like `prisma.launchOfferRedemption.count()` or `prisma.featureFlag.findUnique()`) and are invoked during the initial render of unauthenticated/public pages must degrade gracefully if the database is unreachable, especially during static build pre-rendering.
**Action:** Always wrap these root-level configuration or metric queries in `try/catch` blocks and return safe fallback values (like `0` or `false`) to prevent the entire page or build from crashing.
