'use client';

/**
 * BottomDock — fixed bottom chrome for stage navigation and budget display
 *
 * Shows: ← Prev | stage dots | Next → | budget hint
 * Height: 56px
 */

import type { StageIndex } from './data/canvas-types';
import { STAGE_META } from './data/canvas-data';

interface BottomDockProps {
  stage: StageIndex;
  maxStage: StageIndex;
  secondsLeft: number;
  onNext: () => void;
  onPrev: () => void;
  onNavigate: (stage: StageIndex) => void;
}

export function BottomDock({
  stage,
  maxStage,
  secondsLeft,
  onNext,
  onPrev,
  onNavigate,
}: BottomDockProps) {
  const isFirst = stage === 0;
  const isLast = stage === 6;
  const budget = STAGE_META[stage].budget;
  const minutesLeft = Math.ceil(secondsLeft / 60);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        zIndex: 100,
        background: '#0e0f12',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '0 24px',
        userSelect: 'none',
      }}
    >
      {/* Previous */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          cursor: isFirst ? 'default' : 'pointer',
          opacity: isFirst ? 0.3 : 1,
          padding: '6px 18px',
          fontFamily: 'Geist Mono, monospace',
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
          transition: 'opacity 0.15s',
        }}
      >
        ← Prev
      </button>

      {/* Stage dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {STAGE_META.map((meta, i) => {
          const s = i as StageIndex;
          const isActive = s === stage;
          const isReachable = s <= maxStage;
          return (
            <button
              key={s}
              onClick={() => isReachable && onNavigate(s)}
              disabled={!isReachable}
              title={meta.label}
              style={{
                width: isActive ? 28 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                cursor: isReachable ? 'pointer' : 'default',
                background: isActive
                  ? '#8f95f2'
                  : isReachable
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(255,255,255,0.1)',
                padding: 0,
                transition: 'width 0.25s, background 0.15s',
              }}
            />
          );
        })}
      </div>

      {/* Time budget hint */}
      <span
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 4,
          pointerEvents: 'none',
        }}
      >
        {minutesLeft}m left · {budget}m budget
      </span>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={isLast}
        style={{
          background: isLast ? 'transparent' : '#8f95f2',
          border: isLast ? '1px solid rgba(255,255,255,0.12)' : 'none',
          borderRadius: 8,
          cursor: isLast ? 'default' : 'pointer',
          opacity: isLast ? 0.3 : 1,
          padding: '6px 18px',
          fontFamily: 'Geist Mono, monospace',
          fontSize: 13,
          fontWeight: 600,
          color: isLast ? 'rgba(255,255,255,0.7)' : '#0e0f12',
          transition: 'opacity 0.15s, background 0.15s',
        }}
      >
        Next →
      </button>
    </div>
  );
}
