## 2024-05-23 - Canvas Path Batching
**Learning:** HTML5 Canvas performance is heavily impacted by the number of draw calls (`stroke()`, `fill()`).
**Action:** When drawing multiple shapes of the same style (like grid lines or repetitive icons), always use `beginPath()` once, issue all `moveTo`/`lineTo` commands, and then call `stroke()` once at the end. This reduces overhead significantly (e.g., from 324 calls to 4 calls for a grid).
