## 2026-01-14 - Canvas Grid Batching
**Learning:** `DiagramCanvas` uses manual `ctx.stroke()` calls inside loops for grid drawing, causing hundreds of unnecessary draw calls per frame.
**Action:** Always batch homogenous path operations (like grid lines) into a single `beginPath`/`stroke` cycle.
