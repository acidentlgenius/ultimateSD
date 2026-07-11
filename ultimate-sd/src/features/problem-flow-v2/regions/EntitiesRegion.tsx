'use client';

/**
 * Region 3 — Core Entities
 * Position: left=1250px, top=150px, width=480px
 *
 * DYNAMIC: user creates entity cards from scratch.
 * Starts with 1 blank card. "+ Add entity" button below.
 * Each card has editable name + editable fields (one per line).
 *
 * Entity linking (Task #26):
 *   - "🔗 Link" toggle activates link mode
 *   - Click entity A → highlighted source
 *   - Click entity B → SVG curved arrow drawn between them
 *   - Click a link to select it, then delete
 *   - Cardinality label: defaults to "1:N", editable
 *
 * State model:
 *   content['entities.count']        — number of entity slots (default: 1)
 *   content['entities.${i}.name']    — entity name
 *   content['entities.${i}.fields']  — fields text (one per line: "fieldName: type")
 *   content['entities.${i}.del']     — 'true' if deleted
 *   content['entities.links']        — JSON: EntityLink[]
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EntitiesStageData } from '../data/canvas-types';
import type { UseCanvasContentReturn } from '../hooks/useCanvasContent';
import { TOKENS, RegionLabel } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EntityLink {
  id: string;
  from: number; // entity slot index
  to: number;   // entity slot index
  label: string;
}

interface EntitiesRegionProps {
  data: EntitiesStageData;
  isActive: boolean;
  content: UseCanvasContentReturn;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_COUNT = 1;
const MAX_ENTITIES  = 8;

// 2-column layout positions
const POSITIONS = [
  { col: 0, row: 0, rotation: -0.5, primary: true  },
  { col: 1, row: 0, rotation:  0.4, primary: false },
  { col: 0, row: 1, rotation:  0.3, primary: false },
  { col: 1, row: 1, rotation: -0.3, primary: false },
  { col: 0, row: 2, rotation: -0.4, primary: false },
  { col: 1, row: 2, rotation:  0.5, primary: false },
  { col: 0, row: 3, rotation:  0.3, primary: false },
  { col: 1, row: 3, rotation: -0.4, primary: false },
];

const CARD_W         = 210;
const CARD_GAP_X     = 30;
const CARD_GAP_Y     = 24;
const CARD_BASE_Y    = 52;
const CARD_H_APPROX  = 160;
const CARDINALITIES  = ['1:1', '1:N', 'N:N'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function parseLinks(val: string | undefined): EntityLink[] {
  if (!val) return [];
  try { return JSON.parse(val) as EntityLink[]; }
  catch { return []; }
}

/** Compute the center of a card in the 2-column grid (parent-relative) */
function cardCenter(slot: number): { x: number; y: number } {
  const pos = POSITIONS[slot] ?? POSITIONS[POSITIONS.length - 1];
  const x = pos.col * (CARD_W + CARD_GAP_X) + CARD_W / 2;
  const y = CARD_BASE_Y + pos.row * (CARD_H_APPROX + CARD_GAP_Y) + CARD_H_APPROX / 2;
  return { x, y };
}

// ─── EntityCard ───────────────────────────────────────────────────────────────

function EntityCard({
  index,
  slot,
  content,
  isLinkMode,
  isLinkSource,
  isLinked,
  onDelete,
  onClick,
}: {
  index: number;
  slot: number;
  content: UseCanvasContentReturn;
  isLinkMode: boolean;
  isLinkSource: boolean;
  isLinked: boolean;
  onDelete: (i: number) => void;
  onClick: (i: number) => void;
}) {
  const nameRef   = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);

  const nameKey   = `entities.${index}.name`;
  const fieldsKey = `entities.${index}.fields`;
  const position  = POSITIONS[slot] ?? POSITIONS[POSITIONS.length - 1];

  useEffect(() => {
    if (nameRef.current)   nameRef.current.textContent   = content.content[nameKey]   ?? '';
    if (fieldsRef.current) fieldsRef.current.textContent = content.content[fieldsKey] ?? '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const left = position.col * (CARD_W + CARD_GAP_X);
  const top  = CARD_BASE_Y + position.row * (CARD_H_APPROX + CARD_GAP_Y);

  const borderColor = isLinkSource
    ? '#e8c97c'  // gold highlight = selected source
    : isLinked
      ? TOKENS.accent
      : position.primary
        ? TOKENS.borderHighlight
        : TOKENS.border;

  return (
    <div
      onClick={() => isLinkMode && onClick(index)}
      style={{
        position: 'absolute',
        left,
        top,
        width: CARD_W,
        border: `${isLinkSource || isLinked ? 2 : 1.6}px ${isLinkMode ? 'solid' : 'solid'} ${borderColor}`,
        borderRadius: '7px 9px 8px 7px',
        padding: '8px 28px 10px 12px',
        background: isLinkSource
          ? 'rgba(232,201,124,0.05)'
          : isLinked
            ? 'rgba(143,149,242,0.05)'
            : position.primary
              ? 'rgba(143,149,242,0.04)'
              : 'rgba(255,255,255,0.02)',
        transform: `rotate(${position.rotation}deg)`,
        minHeight: 100,
        cursor: isLinkMode ? 'pointer' : 'default',
        boxShadow: isLinkSource ? `0 0 0 3px rgba(232,201,124,0.15)` : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Delete */}
      {!isLinkMode && (
        <button
          title="Remove entity"
          onClick={(e) => { e.stopPropagation(); onDelete(index); }}
          style={{
            position: 'absolute',
            top: 5,
            right: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 13,
            lineHeight: 1,
            padding: '2px 3px',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,80,80,0.7)')}
          onMouseOut={(e)  => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
        >
          ×
        </button>
      )}

      {/* Entity name */}
      <div
        ref={nameRef}
        contentEditable={!isLinkMode}
        suppressContentEditableWarning
        data-placeholder="EntityName"
        onBlur={() => content.setField(nameKey, nameRef.current?.textContent ?? '')}
        style={{
          fontFamily: TOKENS.fontHandwriting,
          fontSize: 22,
          fontWeight: 600,
          color: TOKENS.text,
          outline: 'none',
          minHeight: 28,
          cursor: isLinkMode ? 'pointer' : 'text',
          pointerEvents: isLinkMode ? 'none' : 'auto',
        }}
      />

      {/* Divider */}
      <div style={{ borderBottom: `1.4px solid rgba(255,255,255,.15)`, margin: '4px 0 6px' }} />

      {/* Fields */}
      <div
        ref={fieldsRef}
        contentEditable={!isLinkMode}
        suppressContentEditableWarning
        data-placeholder={'id: UUID\nuserId: UUID\ncreatedAt: timestamp'}
        onBlur={() => content.setField(fieldsKey, fieldsRef.current?.textContent ?? '')}
        style={{
          fontFamily: TOKENS.fontHandwriting,
          fontSize: 17,
          color: TOKENS.textMuted,
          lineHeight: 1.65,
          outline: 'none',
          whiteSpace: 'pre-wrap',
          minHeight: 56,
          cursor: isLinkMode ? 'pointer' : 'text',
          pointerEvents: isLinkMode ? 'none' : 'auto',
        }}
      />
    </div>
  );
}

// ─── EntitiesRegion ───────────────────────────────────────────────────────────

export function EntitiesRegion({ content }: EntitiesRegionProps) {
  const [linkMode, setLinkMode]   = useState(false);
  const [linkSource, setLinkSource] = useState<number | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  // links stored as JSON in content
  const [links, setLinks] = useState<EntityLink[]>(() =>
    parseLinks(content.content['entities.links']),
  );
  const linksRef    = useRef(links);
  const contentRef  = useRef(content);
  linksRef.current  = links;
  contentRef.current = content;

  const saveLinks = useCallback((l: EntityLink[]) => {
    contentRef.current.setField('entities.links', JSON.stringify(l));
  }, []);

  const rawCount = parseInt(content.content['entities.count'] ?? String(DEFAULT_COUNT), 10);
  const entityCount = isNaN(rawCount) ? DEFAULT_COUNT : Math.min(rawCount, MAX_ENTITIES);

  const visibleIndices = Array.from({ length: entityCount }, (_, i) => i).filter(
    (i) => content.content[`entities.${i}.del`] !== 'true',
  );

  // ── Card interactions ──────────────────────────────────────────────────────

  const handleAdd = () => {
    if (entityCount >= MAX_ENTITIES) return;
    content.setField('entities.count', String(entityCount + 1));
  };

  const handleDelete = (index: number) => {
    content.setField(`entities.${index}.del`, 'true');
    content.setField(`entities.${index}.name`, '');
    content.setField(`entities.${index}.fields`, '');
    // Remove links involving this entity
    const next = linksRef.current.filter((l) => l.from !== index && l.to !== index);
    setLinks(next);
    saveLinks(next);
  };

  // ── Link interactions ──────────────────────────────────────────────────────

  const toggleLinkMode = () => {
    setLinkMode((m) => !m);
    setLinkSource(null);
    setSelectedLink(null);
  };

  const handleCardClick = (index: number) => {
    if (!linkMode) return;

    if (linkSource === null) {
      // First click: set source
      setLinkSource(index);
    } else if (linkSource === index) {
      // Same card: deselect
      setLinkSource(null);
    } else {
      // Second click: create link if not already existing
      const existing = linksRef.current;
      const already = existing.some(
        (l) =>
          (l.from === linkSource && l.to === index) ||
          (l.from === index && l.to === linkSource),
      );
      if (!already) {
        const next = [...existing, { id: genId(), from: linkSource, to: index, label: '1:N' }];
        setLinks(next);
        saveLinks(next);
      }
      setLinkSource(null);
    }
  };

  const deleteLink = (linkId: string) => {
    const next = linksRef.current.filter((l) => l.id !== linkId);
    setLinks(next);
    saveLinks(next);
    setSelectedLink(null);
  };

  const cycleLinkLabel = (linkId: string) => {
    const next = linksRef.current.map((l) => {
      if (l.id !== linkId) return l;
      const idx = CARDINALITIES.indexOf(l.label);
      return { ...l, label: CARDINALITIES[(idx + 1) % CARDINALITIES.length] };
    });
    setLinks(next);
    saveLinks(next);
  };

  // ── Layout ─────────────────────────────────────────────────────────────────

  const visibleCount = visibleIndices.length;
  const rowsNeeded   = Math.ceil(Math.max(visibleCount, 1) / 2);
  const regionHeight = CARD_BASE_Y + rowsNeeded * (CARD_H_APPROX + CARD_GAP_Y) + 64;

  // SVG viewBox covers the card grid area
  const svgW = 2 * CARD_W + CARD_GAP_X;
  const svgH = regionHeight;

  const linkedSlotSet = new Set(
    links.flatMap((l) => {
      const fromSlot = visibleIndices.indexOf(l.from);
      const toSlot   = visibleIndices.indexOf(l.to);
      return [fromSlot, toSlot];
    }),
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 1250,
        top: 150,
        width: 480,
        height: regionHeight,
        animation: 'canvasFadeIn 0.5s ease',
      }}
      onClick={() => setSelectedLink(null)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: CARD_BASE_Y }}>
        <RegionLabel text="Core entities" rotation={0} />

        {/* Link mode toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleLinkMode(); }}
          style={{
            marginLeft: 'auto',
            background: linkMode ? 'rgba(143,149,242,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${linkMode ? TOKENS.accent : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8,
            cursor: 'pointer',
            padding: '4px 12px',
            fontFamily: TOKENS.fontMono,
            fontSize: 12,
            color: linkMode ? TOKENS.accent : 'rgba(255,255,255,0.35)',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          {linkMode ? '🔗 linking...' : '🔗 Link'}
        </button>
      </div>

      {/* Link mode instruction */}
      {linkMode && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: CARD_BASE_Y + 4,
            fontFamily: TOKENS.fontMono,
            fontSize: 10,
            color: 'rgba(232,201,124,0.6)',
          }}
        >
          {linkSource === null ? 'click source entity' : 'click target entity'}
        </div>
      )}

      {/* Empty state */}
      {visibleIndices.length === 0 && (
        <p
          style={{
            fontFamily: TOKENS.fontHandwriting,
            fontSize: 20,
            color: 'rgba(255,255,255,0.2)',
            marginTop: CARD_BASE_Y,
            paddingLeft: 8,
          }}
        >
          Click &quot;+ Add entity&quot; to start
        </p>
      )}

      {/* SVG relationship arrows (behind cards) */}
      <svg
        width={svgW}
        height={svgH}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <marker id="ent-arr" viewBox="0 0 10 10" refX={8} refY={5}
            markerWidth={7} markerHeight={7} orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(143,149,242,0.55)" />
          </marker>
          <marker id="ent-arr-sel" viewBox="0 0 10 10" refX={8} refY={5}
            markerWidth={7} markerHeight={7} orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" fill={TOKENS.accent} />
          </marker>
        </defs>

        {links.map((link) => {
          const fromSlot = visibleIndices.indexOf(link.from);
          const toSlot   = visibleIndices.indexOf(link.to);
          if (fromSlot < 0 || toSlot < 0) return null;

          const from = cardCenter(fromSlot);
          const to   = cardCenter(toSlot);
          const mx   = (from.x + to.x) / 2;
          const my   = (from.y + to.y) / 2;

          // Bezier control point: perpendicular offset for curve
          const dx  = to.x - from.x;
          const dy  = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const curve = Math.min(40, len * 0.25);
          const cx  = mx - (dy / len) * curve;
          const cy  = my + (dx / len) * curve;

          const isSelected = selectedLink === link.id;

          return (
            <g
              key={link.id}
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLink(isSelected ? null : link.id);
              }}
            >
              {/* Wide invisible hit area */}
              <path
                d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                stroke="transparent"
                strokeWidth={14}
                fill="none"
              />
              {/* Visible curve */}
              <path
                d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                stroke={isSelected ? TOKENS.accent : 'rgba(143,149,242,0.4)'}
                strokeWidth={isSelected ? 2 : 1.5}
                fill="none"
                markerEnd={isSelected ? 'url(#ent-arr-sel)' : 'url(#ent-arr)'}
              />

              {/* Cardinality label (click to cycle, × to delete when selected) */}
              <g style={{ pointerEvents: 'all' }}>
                <rect
                  x={cx - 16} y={cy - 11}
                  width={isSelected ? 54 : 32}
                  height={20}
                  rx={4}
                  fill="#0e0f12"
                  stroke={isSelected ? TOKENS.accent : 'rgba(143,149,242,0.3)'}
                  strokeWidth={1.2}
                />
                <text
                  x={cx - 4} y={cy + 4}
                  fill={isSelected ? TOKENS.accent : 'rgba(143,149,242,0.75)'}
                  fontSize={10}
                  fontFamily={TOKENS.fontMono}
                  textAnchor="middle"
                  onClick={(e) => { e.stopPropagation(); cycleLinkLabel(link.id); }}
                  style={{ cursor: 'pointer' }}
                >
                  {link.label}
                </text>
                {isSelected && (
                  <text
                    x={cx + 24} y={cy + 4}
                    fill="rgba(255,80,80,0.8)"
                    fontSize={12}
                    fontFamily={TOKENS.fontMono}
                    textAnchor="middle"
                    onClick={(e) => { e.stopPropagation(); deleteLink(link.id); }}
                    style={{ cursor: 'pointer' }}
                  >
                    ×
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* Entity cards */}
      {visibleIndices.map((idx, slot) => (
        <EntityCard
          key={`entity-${idx}`}
          index={idx}
          slot={slot}
          content={content}
          isLinkMode={linkMode}
          isLinkSource={linkSource === idx}
          isLinked={linkedSlotSet.has(slot)}
          onDelete={handleDelete}
          onClick={handleCardClick}
        />
      ))}

      {/* Add entity button */}
      {entityCount < MAX_ENTITIES && !linkMode && (
        <button
          onClick={handleAdd}
          style={{
            position: 'absolute',
            left: 0,
            top: regionHeight - 44,
            background: 'rgba(255,255,255,0.03)',
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
            e.currentTarget.style.borderColor = TOKENS.borderHighlight;
            e.currentTarget.style.color = TOKENS.accent;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
          }}
        >
          + Add entity
        </button>
      )}
    </div>
  );
}
