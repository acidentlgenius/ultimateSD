'use client';

/**
 * Region 2 — Non-Functional Requirements
 * Position: left=690px, top=420px, width=470px
 *
 * Handwritten list with accent annotations.
 * The entire list is one contentEditable div.
 */

import { useEffect, useRef } from 'react';
import type { NFRStageData } from '../data/canvas-types';
import type { UseCanvasContentReturn } from '../hooks/useCanvasContent';
import { TOKENS, RegionLabel } from './shared';

interface NFRRegionProps {
  data: NFRStageData;
  isActive: boolean;
  content: UseCanvasContentReturn;
}

export function NFRRegion({ data, content }: NFRRegionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const savedText = content.content['nfr.list'];

  useEffect(() => {
    if (ref.current) {
      // Only restore previously saved content — never pre-fill answers
      ref.current.textContent = savedText ?? '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: 690,
        top: 420,
        width: 470,
        animation: 'canvasFadeIn 0.5s ease',
      }}
    >
      <div style={{ transform: 'rotate(0.3deg)', display: 'inline-block' }}>
        <RegionLabel text="Non-functional" rotation={0} />
      </div>

      {/* Scale hints — read only, shown above the list */}
      <div
        style={{
          marginTop: 10,
          marginBottom: 6,
          padding: '6px 10px',
          background: 'rgba(143,149,242,0.06)',
          border: '1px solid rgba(143,149,242,0.12)',
          borderRadius: 8,
        }}
      >
        {data.scaleHints.map((hint, i) => (
          <p
            key={i}
            style={{
              fontFamily: TOKENS.fontHandwriting,
              fontSize: 16,
              color: TOKENS.accent,
              margin: i === 0 ? 0 : '2px 0 0',
              lineHeight: 1.5,
            }}
          >
            {hint}
          </p>
        ))}
      </div>

      {/* Editable NFR list */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write your non-functional requirements (one per line)..."
        onBlur={() => content.setField('nfr.list', ref.current?.textContent ?? '')}
        style={{
          fontFamily: TOKENS.fontHandwriting,
          fontSize: 22,
          color: '#dfe1e8',
          lineHeight: 1.75,
          outline: 'none',
          marginTop: 14,
          transform: 'rotate(-0.3deg)',
          whiteSpace: 'pre-wrap',
          minHeight: 120,
        }}
      />
    </div>
  );
}
