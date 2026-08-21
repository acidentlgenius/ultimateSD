## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-03-08 - Keyboard Navigation for Hover-Only Tooltips
**Learning:** Found several UI elements across multiple components (SchemaBuilder, StepByStepChat, VectorDBVisualizer, MetricsDashboard, CacheVisualizer, PracticeUI) that reveal helpful information or actions *only* on hover using `opacity-0 group-hover:opacity-100`. This hides functionality from keyboard users who cannot hover.
**Action:** Always ensure that visually hidden elements revealed on hover are also revealed on focus (e.g., using `focus-within:opacity-100` or `focus-visible:opacity-100`).
