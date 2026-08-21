## 2026-07-16 - Icon-only buttons accessibility
**Learning:** Icon-only buttons (like the back button in `<CustomProblemPage>`) lack native tooltips. Radix UI and standard HTML buttons need explicit `aria-label` (for screen readers) and `title` (for mouse users) attributes to ensure full accessibility and discoverability.
**Action:** Always add both `aria-label` and `title` to any `<Button size="icon">`, ensuring they are self-documenting for all input methods.
