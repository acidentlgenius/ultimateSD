## 2024-05-24 - Lazy Loading Widgets in StepByStepChat
**Learning:** Large maps of components (like visualization widgets) imported statically can significantly bloat the initial bundle, even if only one is rendered at a time.
**Action:** Use `next/dynamic` with `ssr: false` for client-side heavy components to split them into separate chunks, loading only on demand.
