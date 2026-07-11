/**
 * Shared region utilities and components
 *
 * Memory: memory/tech-contenteditable.md
 */

import React, { useEffect, useRef } from 'react';

// ─── Design Tokens ────────────────────────────────────────────────────────────

export const TOKENS = {
  bg: '#0e0f12',
  card: '#15161c',
  border: '#c9ccd4',
  borderHighlight: '#8f95f2',
  borderDashed: '#8a8d96',
  text: '#e8e9eb',
  textMuted: '#b3b6bf',
  textFaint: '#5f636c',
  accent: '#8f95f2',
  fontHandwriting: 'var(--font-caveat), Caveat, cursive',
  fontMono: 'Geist Mono, monospace',
} as const;

// ─── Region Label ─────────────────────────────────────────────────────────────

export function RegionLabel({
  text,
  rotation = 0,
}: {
  text: string;
  rotation?: number;
}) {
  return (
    <h2
      style={{
        fontFamily: TOKENS.fontHandwriting,
        fontSize: 26,
        fontWeight: 600,
        color: TOKENS.text,
        margin: 0,
        transform: `rotate(${rotation}deg)`,
        display: 'inline-block',
        borderBottom: '2px dashed rgba(255,255,255,.18)',
        paddingBottom: 2,
      }}
    >
      {text}
    </h2>
  );
}

// ─── EditableArea ─────────────────────────────────────────────────────────────

/**
 * ContentEditable area with Caveat font.
 * Uses onBlur to save — never controlled input.
 * Memory: memory/tech-contenteditable.md
 */
export function EditableArea({
  contentKey,
  placeholder,
  initialValue,
  onSave,
  style,
  fontSize = 22,
}: {
  contentKey: string;
  placeholder: string;
  initialValue?: string;
  onSave: (key: string, value: string) => void;
  style?: React.CSSProperties;
  fontSize?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Load initial content once (empty deps = fire once)
  useEffect(() => {
    if (ref.current && initialValue) {
      ref.current.textContent = initialValue;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={() => {
        const text = ref.current?.textContent ?? '';
        onSave(contentKey, text);
      }}
      style={{
        fontFamily: TOKENS.fontHandwriting,
        fontSize,
        color: TOKENS.text,
        lineHeight: 1.65,
        outline: 'none',
        minHeight: 40,
        ...style,
      }}
    />
  );
}

// ─── StickyCard ──────────────────────────────────────────────────────────────

export function StickyCard({
  contentKey,
  initialValue,
  placeholder,
  onSave,
  style,
  borderStyle = 'solid',
  highlighted = false,
}: {
  contentKey: string;
  initialValue?: string;
  placeholder: string;
  onSave: (key: string, value: string) => void;
  style?: React.CSSProperties;
  borderStyle?: 'solid' | 'dashed';
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        border: `1.6px ${borderStyle} ${highlighted ? TOKENS.borderHighlight : TOKENS.border}`,
        borderRadius: '6px 9px 7px 8px',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.02)',
        ...style,
      }}
    >
      <EditableArea
        contentKey={contentKey}
        placeholder={placeholder}
        initialValue={initialValue}
        onSave={onSave}
        fontSize={22}
      />
    </div>
  );
}
