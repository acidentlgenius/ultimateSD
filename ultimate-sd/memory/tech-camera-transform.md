---
name: tech-camera-transform
description: Camera panning uses CSS scale+translate on the 3200×1700 wrapper — NOT individual region repositioning
metadata:
  type: feedback
---

# Camera Transform Technical Decision

## Rule
The camera (viewport pan/zoom) is implemented as a single CSS `transform: scale(s) translate(-tx px, -ty px)` applied to the 3200×1700 canvas wrapper div. Individual regions do NOT move — the camera moves.

**Why:** If each region repositioned itself on stage change, you'd have 7 elements all computing transforms. The design uses one wrapper + CSS transition for smooth animated panning. This is how the prototype works.

## How to Apply

```typescript
// useCamera.ts
export function useCamera(stage: number, vw: number, vh: number): string {
  const r = CAMERA_REGIONS[stage];
  const s = Math.min(r.maxS, (vw - 70) / r.fitW, (vh - 150) / r.fitH);
  const tx = Math.max(-60, r.cx - vw / (2 * s));
  const ty = Math.max(-40, r.cy - (vh - 30) / (2 * s));
  return `scale(${s}) translate(${-tx}px, ${-ty}px)`;
}
```

The wrapper:
```tsx
<div style={{
  position: 'absolute',
  left: 0, top: 0,
  width: 3200, height: 1700,
  transform: cameraTransform,
  transformOrigin: '0 0',  // CRITICAL: must be '0 0' not 'center center'
  transition: 'transform .7s cubic-bezier(.22,1,.36,1)',
}}>
```

## Key Constraints
- `transformOrigin: '0 0'` — never change this
- `vw` and `vh` must come from the canvas element (the flex:1 div), NOT from `window.innerWidth/innerHeight`
- The guide rail (292px when open) reduces the canvas element width — this must be measured, not assumed
- Use `ResizeObserver` on the canvas ref to get accurate dimensions
- Viewport padding for chrome: 70px horizontal, 150px vertical (for top bar + bottom dock)
