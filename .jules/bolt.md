## 2025-10-26 - Canvas Grid Optimization
**Learning:** HTML5 Canvas rendering of grids can be extremely expensive if `stroke()` is called inside a loop. The overhead of rasterizing each line individually is significant (O(N) draw calls).
**Action:** Always batch path creation (`moveTo`, `lineTo`) into a single `beginPath()` context and call `stroke()` once at the end. This reduces draw calls to O(1) regardless of grid size.
