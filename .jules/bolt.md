## 2024-05-23 - [Static Import Bloat]
**Learning:** The `StepByStepChat` component was statically importing over 40 visualization widgets, causing them all to be bundled into the main chunk, even though only one is shown at a time.
**Action:** When implementing widget registries or similar patterns where one of many components is rendered based on a key, always use `next/dynamic` or `React.lazy` to avoid bundling unused components.
