## 2024-05-23 - Lazy Loading Large Component Registries
**Learning:** When using a registry object (e.g., `const WIDGETS = { ... }`) to map strings to components, standard imports cause all referenced components to be bundled in the parent's chunk, even if only one is rendered at a time. This can bloat the bundle size significantly (~45+ widgets in this case).
**Action:** Use `next/dynamic` with `ssr: false` (if appropriate) to lazy load these components. This splits them into separate chunks that are only loaded on demand.
