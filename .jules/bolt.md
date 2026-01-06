## 2024-05-24 - Optimizing ServiceMeshViz
**Learning:** Found that `services.find` was being called inside a render loop for every trace.
**Action:** Memoized the service lookup map and the trace coordinate calculations to improve performance.
