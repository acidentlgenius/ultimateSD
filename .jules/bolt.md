# Bolt's Journal

## 2024-05-22 - [Initial Journal Creation]
**Learning:** Created the journal file.
**Action:** Use this file to log critical performance learnings.

## 2024-05-22 - [Canvas Batching Optimization]
**Learning:** HTML5 Canvas `stroke()` calls are expensive as they trigger rasterization. In a loop drawing a grid, calling `stroke()` for every line (160+ times) is significantly slower than batching all `moveTo`/`lineTo` calls and stroking once.
**Action:** Always batch path operations in `drawGrid` or similar canvas rendering functions.
