## 2024-05-23 - [Canvas Optimization]
**Learning:** Initial exploration revealed `drawGrid` was issuing individual `stroke()` calls inside a loop, contrary to memory/documentation suggesting it was batched. Trust the code over documentation.
**Action:** Use `ctx.beginPath()` once, loop to `moveTo`/`lineTo` for all segments, and call `stroke()` once at the end. Verified with a test counting mock context calls (reduced from ~300+ to 2).
