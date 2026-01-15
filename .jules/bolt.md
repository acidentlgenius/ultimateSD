## 2024-05-22 - [Optimizing Canvas Grid Rendering]
**Learning:** Canvas `stroke()` calls are expensive. Calling `stroke()` inside a loop for drawing a grid is a common performance pitfall.
**Action:** Batch path operations (`moveTo`, `lineTo`) and call `stroke()` once at the end.
