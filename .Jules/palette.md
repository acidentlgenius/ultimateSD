## 2024-03-08 - Keyboard Navigation for Hover-Only Tooltips
**Learning:** Found several UI elements across multiple components (SchemaBuilder, StepByStepChat, VectorDBVisualizer, MetricsDashboard, CacheVisualizer, PracticeUI) that reveal helpful information or actions *only* on hover using `opacity-0 group-hover:opacity-100`. This hides functionality from keyboard users who cannot hover.
**Action:** Always ensure that visually hidden elements revealed on hover are also revealed on focus (e.g., using `focus-within:opacity-100` or `focus-visible:opacity-100`).
