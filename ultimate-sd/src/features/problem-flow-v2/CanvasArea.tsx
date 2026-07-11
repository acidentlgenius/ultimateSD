'use client';

/**
 * CanvasArea — the 3200×1700 infinite canvas with camera transform + drag/pan
 *
 * Features:
 * - CSS transform camera (scale + translate) controlled by useCamera
 * - Drag/pan: hold and drag the canvas background to explore; contentEditable areas
 *   still receive clicks normally (check isContentEditable in mousedown guard)
 * - Stage-based opacity: only the active stage is at full opacity; adjacent stage is
 *   at 0.4 (spatial context); anything further is fully hidden (opacity 0) to avoid
 *   visual clutter from far-away regions
 * - Stage change resets the pan offset (snaps back to stage focus)
 *
 * Memory: memory/tech-camera-transform.md
 * CRITICAL: transformOrigin must be '0 0'
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from './hooks/useCamera';
import type { ProblemCanvasData } from './data/canvas-types';
import type { UseCanvasSessionReturn } from './hooks/useCanvasSession';
import type { UseCanvasContentReturn } from './hooks/useCanvasContent';

// Region components
import { ProblemRegion } from './regions/ProblemRegion';
import { FRRegion } from './regions/FRRegion';
import { NFRRegion } from './regions/NFRRegion';
import { EntitiesRegion } from './regions/EntitiesRegion';
import { APIRegion } from './regions/APIRegion';
import { HLDRegion } from './regions/HLDRegion';
import { DeepDiveRegion } from './regions/DeepDiveRegion';

// Canvas dimensions (matches prototype)
const CANVAS_W = 3200;
const CANVAS_H = 1700;

interface CanvasAreaProps {
  data: ProblemCanvasData;
  session: UseCanvasSessionReturn;
  content: UseCanvasContentReturn;
}

export function CanvasArea({ data, session, content }: CanvasAreaProps) {
  const { state } = session;

  // ─── Pan state ────────────────────────────────────────────────────────────
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<'grab' | 'grabbing'>('grab');
  const isPanning = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  // Reset pan when stage changes
  const prevStage = useRef(state.stage);
  useEffect(() => {
    if (prevStage.current !== state.stage) {
      setPanOffset({ x: 0, y: 0 });
      prevStage.current = state.stage;
    }
  }, [state.stage]);

  // ─── Camera ───────────────────────────────────────────────────────────────
  const { transform, scale, containerRef } = useCamera(state.stage, panOffset);
  const scaleRef = useRef(scale);
  scaleRef.current = scale; // always up to date for mouse handlers

  // ─── Mouse handlers ───────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't steal focus from contentEditable, buttons, inputs
    if (
      target.isContentEditable ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button')
    ) return;

    isPanning.current = true;
    lastPos.current   = { x: e.clientX, y: e.clientY };
    setCursor('grabbing');
    e.preventDefault(); // prevent text selection while panning
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    // Convert screen-pixel delta to canvas-coordinate delta
    const s = scaleRef.current;
    setPanOffset((prev) => ({ x: prev.x + dx / s, y: prev.y + dy / s }));
  }, []);

  const stopPanning = useCallback(() => {
    isPanning.current = false;
    setCursor('grab');
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPanning}
      onMouseLeave={stopPanning}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#0e0f12',
        cursor,
        // Dot grid: spec §2.4
        backgroundImage:
          'radial-gradient(rgba(255,255,255,.055) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        // Prevent text selection while dragging
        userSelect: cursor === 'grabbing' ? 'none' : 'auto',
      }}
    >
      {/* Camera wrapper — this is what transforms, not individual regions */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CANVAS_W,
          height: CANVAS_H,
          transform,
          transformOrigin: '0 0', // CRITICAL: never change this
          transition: cursor === 'grabbing'
            ? 'none'                                   // instant during drag
            : 'transform 0.7s cubic-bezier(.22,1,.36,1)', // smooth on stage change
          willChange: 'transform',
        }}
      >
        {/*
         * Regions: visibility:hidden (not unmounted) to preserve contentEditable state.
         * Opacity dimming:
         *   dist=0  (active)   → 1.0  — full focus
         *   dist=1  (adjacent) → 0.4  — spatial context, clearly receded
         *   dist≥2  (far)      → 0    — completely hidden, no visual noise
         * pointerEvents disabled on non-active regions.
         */}
        <RegionSlot stageIndex={0} currentStage={state.stage} revealed={state.maxStage >= 0}>
          <ProblemRegion data={data.problem} isActive={state.stage === 0} />
        </RegionSlot>

        <RegionSlot stageIndex={1} currentStage={state.stage} revealed={state.maxStage >= 1}>
          <FRRegion
            data={data.fr}
            seniority={state.seniority}
            isActive={state.stage === 1}
            content={content}
          />
        </RegionSlot>

        <RegionSlot stageIndex={2} currentStage={state.stage} revealed={state.maxStage >= 2}>
          <NFRRegion data={data.nfr} isActive={state.stage === 2} content={content} />
        </RegionSlot>

        <RegionSlot stageIndex={3} currentStage={state.stage} revealed={state.maxStage >= 3}>
          <EntitiesRegion data={data.entities} isActive={state.stage === 3} content={content} />
        </RegionSlot>

        <RegionSlot stageIndex={4} currentStage={state.stage} revealed={state.maxStage >= 4}>
          <APIRegion data={data.api} isActive={state.stage === 4} content={content} />
        </RegionSlot>

        <RegionSlot stageIndex={5} currentStage={state.stage} revealed={state.maxStage >= 5}>
          <HLDRegion
            data={data.hld}
            isActive={state.stage === 5 || state.stage === 6}
            content={content}
            cameraScale={scale}
          />
        </RegionSlot>

        <RegionSlot stageIndex={6} currentStage={state.stage} revealed={state.maxStage >= 6}>
          <DeepDiveRegion
            data={data.hld.deepDives}
            isActive={state.stage === 6}
            content={content}
          />
        </RegionSlot>
      </div>
    </div>
  );
}

// ─── RegionSlot ───────────────────────────────────────────────────────────────

function RegionSlot({
  stageIndex,
  currentStage,
  revealed,
  children,
}: {
  stageIndex: number;
  currentStage: number;
  revealed: boolean;
  children: React.ReactNode;
}) {
  if (!revealed) {
    return <div style={{ visibility: 'hidden', pointerEvents: 'none' }}>{children}</div>;
  }

  const dist    = Math.abs(stageIndex - currentStage);
  const opacity = dist === 0 ? 1 : dist === 1 ? 0.4 : 0;
  const active  = dist === 0;

  return (
    <div
      style={{
        opacity,
        transition: 'opacity 0.45s ease',
        pointerEvents: active ? 'auto' : 'none',
        // Prevent stale visible-but-dim regions from receiving cursor
        cursor: active ? 'inherit' : 'default',
      }}
    >
      {children}
    </div>
  );
}
