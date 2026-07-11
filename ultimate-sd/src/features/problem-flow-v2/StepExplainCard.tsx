'use client';

/**
 * StepExplainCard — modal overlay shown on first entry to a stage
 *
 * Dismissed by clicking "Got it" or pressing Escape.
 * After dismiss: timer starts automatically (handled by useCanvasSession).
 */

import { useEffect } from 'react';
import type { StageIndex } from './data/canvas-types';
import { STAGE_META } from './data/canvas-data';

interface StepExplainCardProps {
  stage: StageIndex;
  isOpen: boolean;
  onDismiss: () => void;
}

export function StepExplainCard({ stage, isOpen, onDismiss }: StepExplainCardProps) {
  const meta = STAGE_META[stage];

  // Dismiss on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 201,
          background: '#16181f',
          border: '1px solid rgba(143,149,242,0.25)',
          borderRadius: 16,
          padding: '32px 36px',
          maxWidth: 480,
          width: 'calc(100% - 48px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Stage label */}
        <p
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8f95f2',
            marginBottom: 10,
          }}
        >
          Stage {stage + 1} · {meta.budget} min
        </p>

        {/* Title */}
        <h2
          id="explain-title"
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 20,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)',
            margin: '0 0 14px',
            lineHeight: 1.3,
          }}
        >
          {meta.explainTitle}
        </h2>

        {/* Body */}
        <p
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.65)',
            margin: '0 0 28px',
          }}
        >
          {meta.explainBody}
        </p>

        {/* Got it */}
        <button
          onClick={onDismiss}
          autoFocus
          style={{
            background: '#8f95f2',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            padding: '10px 28px',
            fontFamily: 'Geist Mono, monospace',
            fontSize: 14,
            fontWeight: 700,
            color: '#0e0f12',
            width: '100%',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Got it — start timer
        </button>

        <p
          style={{
            textAlign: 'center',
            marginTop: 10,
            fontFamily: 'Geist Mono, monospace',
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          Press Esc to dismiss
        </p>
      </div>
    </>
  );
}
