## 2024-05-22 - Canvas Drawing Performance
**Learning:** Repetitive `stroke()` calls in Canvas loops (like grids or complex shapes) cause massive overhead (O(N) draw calls).
**Action:** Always batch path definitions: call `beginPath()` once, loop `moveTo/lineTo`, then `stroke()` once (O(1) draw call).
