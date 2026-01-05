## 2024-05-23 - Canvas Grid Performance
**Learning:** HTML5 Canvas `stroke()` is an expensive operation. Calling it inside a loop (e.g. for every grid line) kills performance (O(N) draw calls).
**Action:** Always batch path operations (`moveTo`, `lineTo`) and call `stroke()` once at the end (O(1) draw call) for static geometry like grids.
