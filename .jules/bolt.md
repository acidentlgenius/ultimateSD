## 2026-01-25 - Code Splitting Widget Library
**Learning:** In Next.js, importing a large map of components statically (e.g. 50+ widgets) forces all of them into the main bundle even if only one is rendered.
**Action:** Replace static imports with `next/dynamic` when building component registries/maps to enable lazy loading and reduce TTI.
