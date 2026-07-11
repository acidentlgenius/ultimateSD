'use client';

/**
 * TopBar — fixed top chrome for the canvas session
 *
 * Shows: problem title | stage breadcrumb | timer | seniority selector | guide toggle
 * Height: 52px
 * Background: #0e0f12 (design token: bg)
 */

import React, { useCallback } from 'react';
import { STAGE_META } from './data/canvas-data';
import type { Seniority, StageIndex } from './data/canvas-types';

// ─── Timer Display ────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Seniority Pill ───────────────────────────────────────────────────────────

const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

interface SeniorityPickerProps {
  value: Seniority;
  onChange: (s: Seniority) => void;
}

function SeniorityPicker({ value, onChange }: SeniorityPickerProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '2px 3px',
      }}
    >
      {SENIORITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '3px 10px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'Geist Mono, monospace',
            fontWeight: 500,
            background: value === opt.value ? '#8f95f2' : 'transparent',
            color: value === opt.value ? '#0e0f12' : 'rgba(255,255,255,0.55)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Stage Breadcrumb ─────────────────────────────────────────────────────────

interface StageBreadcrumbProps {
  currentStage: StageIndex;
  maxStage: StageIndex;
  onNavigate: (stage: StageIndex) => void;
}

function StageBreadcrumb({ currentStage, maxStage, onNavigate }: StageBreadcrumbProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STAGE_META.map((meta, i) => {
        const stage = i as StageIndex;
        const isActive = stage === currentStage;
        const isReachable = stage <= maxStage;
        const isLast = i === STAGE_META.length - 1;

        return (
          <React.Fragment key={stage}>
            <button
              onClick={() => isReachable && onNavigate(stage)}
              disabled={!isReachable}
              title={meta.label}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: isActive ? '1px solid rgba(143,149,242,0.4)' : '1px solid transparent',
                cursor: isReachable ? 'pointer' : 'default',
                fontSize: 11,
                fontFamily: 'Geist Mono, monospace',
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(143,149,242,0.12)' : 'transparent',
                color: isActive
                  ? '#8f95f2'
                  : isReachable
                    ? 'rgba(255,255,255,0.65)'
                    : 'rgba(255,255,255,0.22)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {i + 1}. {meta.label}
            </button>
            {!isLast && (
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: '0 1px' }}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export interface TopBarProps {
  problemTitle: string;
  stage: StageIndex;
  maxStage: StageIndex;
  secondsLeft: number;
  timerRunning: boolean;
  seniority: Seniority;
  guideOpen: boolean;
  isSaving: boolean;
  onNavigate: (stage: StageIndex) => void;
  onToggleTimer: () => void;
  onSeniorityChange: (s: Seniority) => void;
  onToggleGuide: () => void;
  onExit: () => void;
}

export function TopBar({
  problemTitle,
  stage,
  maxStage,
  secondsLeft,
  timerRunning,
  seniority,
  guideOpen,
  isSaving,
  onNavigate,
  onToggleTimer,
  onSeniorityChange,
  onToggleGuide,
  onExit,
}: TopBarProps) {
  const isLow = secondsLeft < 60;
  const isEmpty = secondsLeft === 0;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNavigate(Math.min(6, stage + 1) as StageIndex);
      if (e.key === 'ArrowLeft') onNavigate(Math.max(0, stage - 1) as StageIndex);
    },
    [onNavigate, stage],
  );

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 100,
        background: '#0e0f12',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        userSelect: 'none',
      }}
    >
      {/* Exit / back */}
      <button
        onClick={onExit}
        title="Exit session"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 18,
          padding: '0 4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ←
      </button>

      {/* Problem title */}
      <span
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          flexShrink: 0,
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {problemTitle}
      </span>

      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>|</span>

      {/* Stage breadcrumb — scrollable on small screens */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <StageBreadcrumb
            currentStage={stage}
            maxStage={maxStage}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>
          saving…
        </span>
      )}

      {/* Seniority picker */}
      <SeniorityPicker value={seniority} onChange={onSeniorityChange} />

      {/* Timer */}
      <button
        onClick={onToggleTimer}
        style={{
          background: isEmpty
            ? 'rgba(217,154,154,0.15)'
            : isLow
              ? 'rgba(217,192,138,0.12)'
              : 'rgba(255,255,255,0.06)',
          border: `1px solid ${
            isEmpty
              ? 'rgba(217,154,154,0.35)'
              : isLow
                ? 'rgba(217,192,138,0.3)'
                : 'rgba(255,255,255,0.12)'
          }`,
          borderRadius: 8,
          cursor: 'pointer',
          padding: '4px 12px',
          fontFamily: 'Geist Mono, monospace',
          fontSize: 13,
          fontWeight: 600,
          color: isEmpty ? '#d99a9a' : isLow ? '#d9c08a' : 'rgba(255,255,255,0.8)',
          letterSpacing: '0.05em',
          flexShrink: 0,
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 9, opacity: 0.7 }}>{timerRunning ? '⏸' : '▶'}</span>
        {formatTime(secondsLeft)}
      </button>

      {/* Guide rail toggle */}
      <button
        onClick={onToggleGuide}
        title={guideOpen ? 'Close guide rail' : 'Open guide rail'}
        style={{
          background: guideOpen ? 'rgba(143,149,242,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${guideOpen ? 'rgba(143,149,242,0.35)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 8,
          cursor: 'pointer',
          padding: '4px 10px',
          fontSize: 13,
          color: guideOpen ? '#8f95f2' : 'rgba(255,255,255,0.5)',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {guideOpen ? '▶ Guide' : '◀ Guide'}
      </button>
    </div>
  );
}
