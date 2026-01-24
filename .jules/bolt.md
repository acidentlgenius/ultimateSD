## 2024-05-23 - Dynamic Imports for Widgets
**Learning:** `StepByStepChat.tsx` was importing ~50 widget components statically, which likely caused a large bundle size. The `next/dynamic` utility works well for this, but required creating a loading component.
**Action:** When working with large lists of heavy components in Next.js, always use `next/dynamic` with a loading state to improve initial page load performance.
