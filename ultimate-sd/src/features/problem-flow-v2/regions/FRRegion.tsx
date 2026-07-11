'use client';

/**
 * Region 1 — Functional Requirements
 * Position: left=690px, top=150px, width=520px
 *
 * DYNAMIC: user adds/removes sticky-note cards.
 * Cards start blank. Per-problem FR hints live in guide rail only.
 *
 * State model:
 *   content['fr.cardCount']      — number of slots (default: 4)
 *   content['fr.card${i}']       — text in slot i
 *   content['fr.card${i}.oos']   — 'true' if marked out-of-scope
 *   content['fr.card${i}.del']   — 'true' if card deleted
 */

import { useEffect, useRef } from 'react';
import type { FRStageData, Seniority } from '../data/canvas-types';
import type { UseCanvasContentReturn } from '../hooks/useCanvasContent';
import { TOKENS, RegionLabel } from './shared';

interface FRRegionProps {
  data: FRStageData;       // kept for type compat; used only by guide rail
  seniority: Seniority;   // kept for type compat; used only by guide rail
  isActive: boolean;
  content: UseCanvasContentReturn;
}

// Fixed layout positions for up to 8 cards
const POSITIONS = [
  { left: 6,   top: 58,  width: 210, rotation: -0.7 },
  { left: 250, top: 66,  width: 230, rotation:  0.6 },
  { left: 6,   top: 210, width: 220, rotation:  0.4 },
  { left: 250, top: 218, width: 230, rotation: -0.4 },
  { left: 6,   top: 362, width: 210, rotation:  0.3 },
  { left: 250, top: 370, width: 230, rotation: -0.5 },
  { left: 6,   top: 514, width: 220, rotation: -0.3 },
  { left: 250, top: 520, width: 230, rotation:  0.5 },
];

const DEFAULT_COUNT = 4;
const MAX_CARDS = 8;

function FRCard({
  index,
  position,
  content,
  onDelete,
}: {
  index: number;
  position: typeof POSITIONS[0];
  content: UseCanvasContentReturn;
  onDelete: (i: number) => void;
}) {
  const textKey = `fr.card${index}`;
  const oosKey  = `fr.card${index}.oos`;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.textContent = content.content[textKey] ?? '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOos  = content.content[oosKey] === 'true';
  const isDashed = index === 3 || isOos; // 4th slot defaults to "out-of-scope"

  return (
    <div
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: position.width,
        border: `1.6px ${isDashed ? 'dashed' : 'solid'} ${isDashed ? TOKENS.borderDashed : TOKENS.border}`,
        borderRadius: '6px 9px 7px 8px',
        padding: '8px 28px 8px 12px', // right padding for × button
        background: 'rgba(255,255,255,0.02)',
        transform: `rotate(${position.rotation}deg)`,
        minHeight: 80,
      }}
    >
      {/* Out-of-scope toggle */}
      <button
        title={isOos ? 'Mark in-scope' : 'Mark out-of-scope'}
        onClick={() =>
          content.setField(oosKey, isOos ? 'false' : 'true')
        }
        style={{
          position: 'absolute',
          top: 4,
          right: 22,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isOos ? TOKENS.accent : 'rgba(255,255,255,0.2)',
          fontSize: 10,
          lineHeight: 1,
          padding: '2px 3px',
          fontFamily: TOKENS.fontMono,
        }}
      >
        {isOos ? 'OOS' : '⊘'}
      </button>

      {/* Delete card */}
      <button
        title="Remove card"
        onClick={() => onDelete(index)}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.18)',
          fontSize: 13,
          lineHeight: 1,
          padding: '2px 3px',
        }}
      >
        ×
      </button>

      {/* Editable text */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={
          isDashed ? 'Out of scope / stretch goal...' : 'Write a functional requirement...'
        }
        onBlur={() => content.setField(textKey, ref.current?.textContent ?? '')}
        style={{
          fontFamily: TOKENS.fontHandwriting,
          fontSize: 22,
          color: isDashed ? '#9a9da6' : TOKENS.text,
          lineHeight: 1.65,
          outline: 'none',
          minHeight: 40,
          cursor: 'text',
        }}
      />
    </div>
  );
}

export function FRRegion({ content }: FRRegionProps) {
  const rawCount = parseInt(content.content['fr.cardCount'] ?? String(DEFAULT_COUNT), 10);
  const cardCount = isNaN(rawCount) ? DEFAULT_COUNT : Math.min(rawCount, MAX_CARDS);

  // Visible card indices = those not marked deleted
  const visibleIndices = Array.from({ length: cardCount }, (_, i) => i).filter(
    (i) => content.content[`fr.card${i}.del`] !== 'true',
  );

  const handleAdd = () => {
    if (cardCount >= MAX_CARDS) return;
    content.setField('fr.cardCount', String(cardCount + 1));
  };

  const handleDelete = (index: number) => {
    content.setField(`fr.card${index}.del`, 'true');
    // Clear the text too
    content.setField(`fr.card${index}`, '');
  };

  // Height adjusts as cards are added
  const heightNeeded = cardCount <= 4 ? 400 : cardCount <= 6 ? 560 : 700;

  return (
    <div
      style={{
        position: 'absolute',
        left: 690,
        top: 150,
        width: 500,
        height: heightNeeded,
        animation: 'canvasFadeIn 0.5s ease',
      }}
    >
      <RegionLabel text="Functional requirements" rotation={-0.5} />

      <span
        style={{
          position: 'absolute',
          right: 0,
          top: 4,
          fontFamily: TOKENS.fontMono,
          fontSize: 11,
          color: 'rgba(255,255,255,0.2)',
        }}
      >
        hints → guide rail
      </span>

      {/* Cards */}
      {visibleIndices.map((i) => {
        const pos = POSITIONS[i] ?? POSITIONS[POSITIONS.length - 1];
        return (
          <FRCard
            key={`fr-card-${i}`}
            index={i}
            position={pos}
            content={content}
            onDelete={handleDelete}
          />
        );
      })}

      {/* Add card button */}
      {cardCount < MAX_CARDS && (
        <button
          onClick={handleAdd}
          style={{
            position: 'absolute',
            left: 6,
            top: heightNeeded - 38,
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px dashed rgba(255,255,255,0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            padding: '6px 18px',
            fontFamily: TOKENS.fontHandwriting,
            fontSize: 20,
            color: 'rgba(255,255,255,0.35)',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
          }}
        >
          + Add requirement
        </button>
      )}
    </div>
  );
}
