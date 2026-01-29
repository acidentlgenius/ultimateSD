## 2025-02-15 - Canvas Drawing Optimization
**Learning:** The `DiagramCanvas` component was issuing individual `stroke()` calls for every grid line, causing hundreds of unnecessary draw calls per frame. Batching these into a single path significantly reduces overhead.
**Action:** Always look for loops in Canvas drawing code and batch operations (beginPath -> loop -> stroke) where possible.
