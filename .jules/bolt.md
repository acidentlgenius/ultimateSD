## 2024-05-22 - Canvas Drawing Batching
**Learning:** The `DiagramCanvas` component was making redundant `stroke()` calls within loops for shapes like `server`, `loadbalancer`, and `api`. In HTML5 Canvas, `stroke()` is an expensive operation because it rasterizes the current path.
**Action:** Always batch path construction commands (`moveTo`, `lineTo`) before calling `stroke()` once at the end of the sequence. This significantly reduces the overhead of rasterization and state changes.
