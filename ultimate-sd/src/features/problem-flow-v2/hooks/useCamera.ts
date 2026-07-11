/**
 * useCamera — pure camera transform calculation
 *
 * Spec: docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md §5
 * Memory: memory/tech-camera-transform.md
 *
 * Formula extracted from Canvas Session.dc.html prototype (DCLogic.goTo method).
 *
 * CRITICAL: transformOrigin must be '0 0' on the canvas wrapper.
 * CRITICAL: vw/vh must be measured from the canvas element, NOT window dimensions.
 *
 * panOffset: additive offset in CANVAS coordinates (already divided by scale).
 * Call with panOffset to support drag/pan on top of stage-based camera.
 * Reset panOffset to {x:0, y:0} on stage change to snap back to stage focus.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CAMERA_REGIONS } from '../data/canvas-data';
import type { StageIndex } from '../data/canvas-types';

/** Viewport padding reserved for chrome (top bar + bottom dock + margins) */
const VIEWPORT_PAD_H = 70;
const VIEWPORT_PAD_V = 150;

/** Minimum scale to prevent the canvas from being too zoomed out */
const MIN_SCALE = 0.25;

export interface UseCameraReturn {
  /** CSS transform string to apply to the 3200×1700 canvas wrapper */
  transform: string;
  /** Current scale value — needed by CanvasArea for pan delta calculation */
  scale: number;
  /** Ref to attach to the outer canvas container element */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Computes the CSS transform for the canvas wrapper to focus on the given stage region.
 * panOffset (in canvas-space units) is added to the translation — use for drag/pan.
 */
export function useCamera(
  stage: StageIndex,
  panOffset: { x: number; y: number } = { x: 0, y: 0 },
): UseCameraReturn {
  const containerRef = useRef<HTMLDivElement>(null!) as React.RefObject<HTMLDivElement>;
  const [dimensions, setDimensions] = useState({ vw: 800, vh: 600 });

  // Measure the canvas container — NOT window, because the guide rail shrinks it
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          vw: entry.contentRect.width,
          vh: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const computeResult = useCallback(
    (
      stageIdx: StageIndex,
      vw: number,
      vh: number,
      pan: { x: number; y: number },
    ): { transform: string; scale: number } => {
      const r = CAMERA_REGIONS[stageIdx];

      // Scale: fit the stage's bounding box in the available viewport,
      // but cap at maxS so we don't zoom in too far
      const s = Math.max(
        MIN_SCALE,
        Math.min(r.maxS, (vw - VIEWPORT_PAD_H) / r.fitW, (vh - VIEWPORT_PAD_V) / r.fitH),
      );

      // Translate: center the region's (cx, cy) in the viewport, then apply pan offset
      const tx = Math.max(-60, r.cx - vw / (2 * s)) - pan.x;
      const ty = Math.max(-40, r.cy - (vh - 30) / (2 * s)) - pan.y;

      return {
        transform: `scale(${s.toFixed(4)}) translate(${(-tx).toFixed(1)}px, ${(-ty).toFixed(1)}px)`,
        scale: s,
      };
    },
    [],
  );

  const { transform, scale } = computeResult(stage, dimensions.vw, dimensions.vh, panOffset);

  return { transform, scale, containerRef };
}
