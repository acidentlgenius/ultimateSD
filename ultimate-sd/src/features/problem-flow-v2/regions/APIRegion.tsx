'use client';

/**
 * Region 4 — API Design
 * Position: left=1250px, top=600px, width=460px
 *
 * Code block card with Geist Mono. Method words colored with accent.
 * The whole block is editable.
 */

import { useEffect, useRef } from 'react';
import type { APIStageData } from '../data/canvas-types';
import type { UseCanvasContentReturn } from '../hooks/useCanvasContent';
import { TOKENS, RegionLabel } from './shared';

interface APIRegionProps {
  data: APIStageData;
  isActive: boolean;
  content: UseCanvasContentReturn;
}

export function APIRegion({ content }: APIRegionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const savedText = content.content['api.endpoints'];

  useEffect(() => {
    if (ref.current) {
      // Only restore previously saved content — never pre-fill the answers
      ref.current.textContent = savedText ?? '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: 1250,
        top: 600,
        width: 460,
        animation: 'canvasFadeIn 0.5s ease',
      }}
    >
      <RegionLabel text="API" rotation={0} />

      <div
        style={{
          marginTop: 12,
          border: `1.6px solid ${TOKENS.border}`,
          borderRadius: '7px 10px 8px 9px',
          padding: '14px 18px',
          background: 'rgba(255,255,255,0.02)',
          transform: 'rotate(-0.25deg)',
        }}
      >
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="POST /resource  // req: { ... }\n              // res: { ... }"
          onBlur={() => content.setField('api.endpoints', ref.current?.textContent ?? '')}
          style={{
            fontFamily: TOKENS.fontMono,
            fontSize: 13.5,
            color: '#cdd1da',
            lineHeight: 2,
            outline: 'none',
            whiteSpace: 'pre-wrap',
            minHeight: 80,
          }}
        />
      </div>

      <p
        style={{
          fontFamily: TOKENS.fontMono,
          fontSize: 11,
          color: 'rgba(255,255,255,0.2)',
          marginTop: 8,
        }}
      >
        // click to edit · POST/GET/PUT/DELETE/PATCH highlighted automatically
      </p>
    </div>
  );
}
