## 2024-05-23 - Canvas Grid Rendering Optimization
**Learning:** `DiagramCanvas` was redrawing the grid using individual `stroke()` calls for every line, resulting in ~300+ context calls per frame (or render). This is a significant overhead for a static background element.
**Action:** Always batch homogenous Canvas API calls (like grid lines) into a single path using `beginPath` -> loop `moveTo`/`lineTo` -> single `stroke`.
