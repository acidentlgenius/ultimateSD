'use client';

/**
 * Region 6 — Deep Dives
 * Position: overlaps with HLD region — left=1870px, top=780px (below HLD)
 *
 * Shows deep dive topic cards below the HLD diagram.
 * Each card shows title, description, and time budget.
 * User can add notes to each deep dive.
 */

import { useEffect, useRef } from 'react';
import type { DeepDiveTopic } from '../data/canvas-types';
import type { UseCanvasContentReturn } from '../hooks/useCanvasContent';
import { TOKENS, RegionLabel } from './shared';

interface DeepDiveRegionProps {
  data: DeepDiveTopic[];
  isActive: boolean;
  content: UseCanvasContentReturn;
}

function DeepDiveCard({
  topic,
  index,
  content,
}: {
  topic: DeepDiveTopic;
  index: number;
  content: UseCanvasContentReturn;
}) {
  const notesKey = `dd.notes.${index}`;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && content.content[notesKey]) {
      ref.current.textContent = content.content[notesKey];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotations = [-0.5, 0.4, -0.3];
  const rotation = rotations[index % rotations.length];

  return (
    <div
      style={{
        width: 300,
        border: `1.6px solid ${TOKENS.border}`,
        borderRadius: '8px 10px 9px 8px',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.02)',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Time budget chip */}
      <span
        style={{
          fontFamily: TOKENS.fontMono,
          fontSize: 10,
          color: TOKENS.accent,
          fontWeight: 700,
          letterSpacing: '0.08em',
          background: 'rgba(143,149,242,0.1)',
          padding: '2px 8px',
          borderRadius: 4,
        }}
      >
        {topic.minutes} min
      </span>

      {/* Title */}
      <p
        style={{
          fontFamily: TOKENS.fontHandwriting,
          fontSize: 22,
          fontWeight: 600,
          color: TOKENS.text,
          margin: '8px 0 4px',
          lineHeight: 1.3,
        }}
      >
        {topic.title}
      </p>

      {/* Description */}
      <p
        style={{
          fontFamily: TOKENS.fontHandwriting,
          fontSize: 18,
          color: TOKENS.textMuted,
          margin: '0 0 10px',
          lineHeight: 1.5,
        }}
      >
        {topic.description}
      </p>

      {/* User notes */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Add your notes here..."
        onBlur={() => content.setField(notesKey, ref.current?.textContent ?? '')}
        style={{
          fontFamily: TOKENS.fontHandwriting,
          fontSize: 20,
          color: TOKENS.text,
          lineHeight: 1.6,
          outline: 'none',
          minHeight: 60,
          borderTop: '1px dashed rgba(255,255,255,0.1)',
          paddingTop: 8,
        }}
      />
    </div>
  );
}

export function DeepDiveRegion({ data, content }: DeepDiveRegionProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 1870,
        top: 790,
        width: 1030,
        animation: 'canvasFadeIn 0.5s ease',
      }}
    >
      <RegionLabel text="Deep dives" rotation={0} />

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {data.map((topic, i) => (
          <DeepDiveCard
            key={i}
            topic={topic}
            index={i}
            content={content}
          />
        ))}
      </div>
    </div>
  );
}
