## 2024-05-23 - Canvas Grid Batching
**Learning:** The `drawGrid` function was making ~160 separate `stroke()` calls per frame (one for each line).
**Action:** Batched all line segments into a single path and called `stroke()` once. This reduces overhead significantly on the main thread during redraws.
