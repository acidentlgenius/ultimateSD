## 2026-02-01 - Canvas Grid Optimization
**Learning:** `ctx.stroke()` is an expensive operation that triggers rasterization. Drawing a grid line-by-line (e.g., 160 calls) is significantly slower than batching all `moveTo`/`lineTo` calls into a single path and calling `stroke()` once.
**Action:** Always batch Canvas drawing operations for uniform elements (same style) into a single path. Use `DiagramCanvas_perf.test.tsx` pattern (mocking `getContext`) to verify draw call counts.
