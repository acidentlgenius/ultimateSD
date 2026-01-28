## 2025-02-23 - Canvas Rendering Optimization
**Learning:** The `DiagramCanvas` component was issuing individual `stroke()` calls for every line in the grid and for various element details. This is a significant bottleneck as the number of elements grows or for the grid which has many lines.
**Action:** When working with Canvas API, always batch `moveTo`/`lineTo` calls into a single path before calling `stroke()` to minimize the overhead of rasterization and state changes.
