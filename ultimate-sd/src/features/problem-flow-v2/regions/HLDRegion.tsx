'use client';

/**
 * Region 5 — High-Level Design: Drag/Drop Diagram Board
 * Position: left=1870px, top=120px, width=1100px, height=680px
 *
 * Full interactive diagram builder:
 *   - 7 node types: Client, Load Balancer, Service, Database, Cache, Queue, CDN
 *   - Drag nodes to reposition anywhere on the board
 *   - Hover a node → 4 connection handles appear (N/S/E/W)
 *   - Drag from handle → draw connection to another node
 *   - Click node label to edit
 *   - × button per node to delete (also deletes connected edges)
 *   - Click edge to select/delete
 *
 * Coordinate system:
 *   All node x/y are in board-local pixels (origin = board top-left).
 *   movementX/Y from document mousemove are in screen pixels;
 *   divide by cameraScale to get canvas pixels.
 *
 * Persistence: hld.nodes + hld.edges stored as JSON in content store.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HLDStageData } from '../data/canvas-types';
import type { UseCanvasContentReturn } from '../hooks/useCanvasContent';
import { TOKENS, RegionLabel } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HLDNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
}

interface HLDEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

type NodeType = 'client' | 'lb' | 'service' | 'db' | 'cache' | 'queue' | 'cdn';

export interface HLDRegionProps {
  data: HLDStageData;
  isActive: boolean;
  content: UseCanvasContentReturn;
  cameraScale?: number;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const REGION_W  = 1100;
const TOOLBAR_H = 52;
const LABEL_H   = 38;
const BOARD_TOP = LABEL_H + TOOLBAR_H;
const REGION_H  = 680;

const NODE_W = 164;
const NODE_H = 56;

const NODE_CFG: Record<NodeType, { label: string; border: string; bg: string; btn: string }> = {
  client:  { label: 'Client',        border: '#c9ccd4', bg: 'rgba(201,204,212,0.07)', btn: '👤 Client'        },
  lb:      { label: 'Load Balancer', border: '#e8a87c', bg: 'rgba(232,168,124,0.07)', btn: '⚖ Load Balancer'  },
  service: { label: 'Service',       border: '#8f95f2', bg: 'rgba(143,149,242,0.07)', btn: '⚡ Service'       },
  db:      { label: 'Database',      border: '#c084e8', bg: 'rgba(192,132,232,0.07)', btn: '🗄 Database'      },
  cache:   { label: 'Cache',         border: '#7ce8a8', bg: 'rgba(124,232,168,0.07)', btn: '💾 Cache'         },
  queue:   { label: 'Queue',         border: '#e8d97c', bg: 'rgba(232,217,124,0.07)', btn: '📬 Queue'         },
  cdn:     { label: 'CDN',           border: '#7cc8e8', bg: 'rgba(124,200,232,0.07)', btn: '🌐 CDN'           },
};

const NODE_TYPES = Object.keys(NODE_CFG) as NodeType[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function parseJSON<T>(val: string | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; }
  catch { return fallback; }
}

/** Pick handle endpoints and bezier control points for an edge between two nodes */
function edgePoints(from: HLDNode, to: HLDNode) {
  const fdx = (to.x + NODE_W / 2) - (from.x + NODE_W / 2);
  const fdy = (to.y + NODE_H / 2) - (from.y + NODE_H / 2);
  let fx: number, fy: number, tx: number, ty: number;

  if (Math.abs(fdx) >= Math.abs(fdy)) {
    if (fdx >= 0) {
      fx = from.x + NODE_W; fy = from.y + NODE_H / 2;
      tx = to.x;            ty = to.y   + NODE_H / 2;
    } else {
      fx = from.x;          fy = from.y + NODE_H / 2;
      tx = to.x + NODE_W;  ty = to.y   + NODE_H / 2;
    }
  } else {
    if (fdy >= 0) {
      fx = from.x + NODE_W / 2; fy = from.y + NODE_H;
      tx = to.x   + NODE_W / 2; ty = to.y;
    } else {
      fx = from.x + NODE_W / 2; fy = from.y;
      tx = to.x   + NODE_W / 2; ty = to.y + NODE_H;
    }
  }

  const mx = (tx - fx) * 0.45;
  const my = (ty - fy) * 0.45;
  return { fx, fy, tx, ty, c1x: fx + mx, c1y: fy + my, c2x: tx - mx, c2y: ty - my };
}

// ─── HLDRegion ────────────────────────────────────────────────────────────────

export function HLDRegion({ content, cameraScale = 1 }: HLDRegionProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [nodes, setNodes] = useState<HLDNode[]>(() =>
    parseJSON(content.content['hld.nodes'], []),
  );
  const [edges, setEdges] = useState<HLDEdge[]>(() =>
    parseJSON(content.content['hld.edges'], []),
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  // Connection draft: fx/fy = handle start (board-local), cx/cy = cursor (board-local)
  const [draft, setDraft] = useState<{ fx: number; fy: number; cx: number; cy: number } | null>(null);

  // ── Refs (stable across renders for document listeners) ────────────────────
  const boardRef      = useRef<HTMLDivElement>(null);
  const draggingRef   = useRef<{ nodeId: string } | null>(null);
  const connectingRef = useRef<{ fromNodeId: string; fx: number; fy: number } | null>(null);
  const nodesRef      = useRef(nodes);
  const edgesRef      = useRef(edges);
  const cameraRef     = useRef(cameraScale);
  const contentRef    = useRef(content);

  nodesRef.current  = nodes;
  edgesRef.current  = edges;
  cameraRef.current = cameraScale;
  contentRef.current = content;

  // ── Persistence helpers ────────────────────────────────────────────────────
  const saveNodes = useCallback((n: HLDNode[]) => {
    contentRef.current.setField('hld.nodes', JSON.stringify(n));
  }, []);

  const saveEdges = useCallback((e: HLDEdge[]) => {
    contentRef.current.setField('hld.edges', JSON.stringify(e));
  }, []);

  // ── Document-level mouse listeners (stable, use refs) ─────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Node dragging
      if (draggingRef.current) {
        const dx = e.movementX / cameraRef.current;
        const dy = e.movementY / cameraRef.current;
        setNodes((prev) => {
          const next = prev.map((n) =>
            n.id === draggingRef.current!.nodeId
              ? { ...n, x: Math.max(0, n.x + dx), y: Math.max(0, n.y + dy) }
              : n,
          );
          saveNodes(next);
          return next;
        });
      }

      // Connection draft cursor tracking
      if (connectingRef.current && boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / cameraRef.current;
        const cy = (e.clientY - rect.top) / cameraRef.current;
        setDraft((prev) => (prev ? { ...prev, cx, cy } : null));
      }
    };

    const onUp = () => {
      draggingRef.current   = null;
      connectingRef.current = null;
      setDraft(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [saveNodes]);

  // ── Node actions ───────────────────────────────────────────────────────────
  const addNode = useCallback((type: NodeType) => {
    const existing = nodesRef.current;
    const col  = existing.length % 4;
    const row  = Math.floor(existing.length / 4);
    const node: HLDNode = {
      id: genId(),
      type,
      label: NODE_CFG[type].label,
      x: 20 + col * (NODE_W + 30),
      y: 20 + row * (NODE_H + 40),
    };
    const next = [...existing, node];
    setNodes(next);
    saveNodes(next);
  }, [saveNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    const nextNodes = nodesRef.current.filter((n) => n.id !== nodeId);
    const nextEdges = edgesRef.current.filter((e) => e.from !== nodeId && e.to !== nodeId);
    setNodes(nextNodes);
    setEdges(nextEdges);
    saveNodes(nextNodes);
    saveEdges(nextEdges);
  }, [saveNodes, saveEdges]);

  const startDrag = useCallback((e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).isContentEditable) return;
    e.stopPropagation(); // prevent canvas pan
    draggingRef.current = { nodeId };
  }, []);

  const updateLabel = useCallback((nodeId: string, label: string) => {
    setNodes((prev) => {
      const next = prev.map((n) => (n.id === nodeId ? { ...n, label } : n));
      saveNodes(next);
      return next;
    });
  }, [saveNodes]);

  // ── Connection actions ─────────────────────────────────────────────────────
  const startConnect = useCallback(
    (e: React.MouseEvent, fromNodeId: string, fx: number, fy: number) => {
      e.stopPropagation();
      e.preventDefault();
      connectingRef.current = { fromNodeId, fx, fy };
      setDraft({ fx, fy, cx: fx, cy: fy });
    },
    [],
  );

  const completeConnect = useCallback((toNodeId: string) => {
    if (!connectingRef.current) return;
    const { fromNodeId } = connectingRef.current;
    if (fromNodeId === toNodeId) return;
    const existing = edgesRef.current;
    const already = existing.some(
      (e) =>
        (e.from === fromNodeId && e.to === toNodeId) ||
        (e.from === toNodeId   && e.to === fromNodeId),
    );
    if (!already) {
      const next = [...existing, { id: genId(), from: fromNodeId, to: toNodeId }];
      setEdges(next);
      saveEdges(next);
    }
    connectingRef.current = null;
    setDraft(null);
  }, [saveEdges]);

  const deleteEdge = useCallback((edgeId: string) => {
    const next = edgesRef.current.filter((e) => e.id !== edgeId);
    setEdges(next);
    saveEdges(next);
    setSelectedEdge(null);
  }, [saveEdges]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div
      style={{
        position: 'absolute',
        left: 1870,
        top: 120,
        width: REGION_W,
        height: REGION_H,
        animation: 'canvasFadeIn 0.5s ease',
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: LABEL_H }}>
        <RegionLabel text="High-level design" rotation={0} />
        <span style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
          drag nodes · drag handles to connect
        </span>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          height: TOOLBAR_H,
          paddingLeft: 2,
          flexWrap: 'wrap',
        }}
      >
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => addNode(type)}
            style={{
              background: NODE_CFG[type].bg,
              border: `1.5px solid ${NODE_CFG[type].border}`,
              borderRadius: 8,
              cursor: 'pointer',
              padding: '5px 12px',
              fontFamily: TOKENS.fontHandwriting,
              fontSize: 17,
              color: TOKENS.text,
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseOut={(e)  => (e.currentTarget.style.opacity = '1')}
          >
            {NODE_CFG[type].btn}
          </button>
        ))}

        {/* Clear all */}
        {nodes.length > 0 && (
          <button
            onClick={() => {
              setNodes([]); setEdges([]);
              saveNodes([]); saveEdges([]);
            }}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '5px 12px',
              fontFamily: TOKENS.fontMono,
              fontSize: 11,
              color: 'rgba(255,80,80,0.5)',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,80,80,0.85)')}
            onMouseOut={(e)  => (e.currentTarget.style.color = 'rgba(255,80,80,0.5)')}
          >
            clear all
          </button>
        )}
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        style={{
          position: 'absolute',
          left: 0,
          top: BOARD_TOP,
          width: REGION_W,
          height: REGION_H - BOARD_TOP,
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.015)',
          overflow: 'hidden',
          // Subtle dot grid on board
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        onClick={() => setSelectedEdge(null)}
      >
        {/* SVG overlay: edges + draft line */}
        <svg
          width={REGION_W}
          height={REGION_H - BOARD_TOP}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
        >
          <defs>
            <marker id="hld-arr" viewBox="0 0 10 10" refX={8} refY={5}
              markerWidth={7} markerHeight={7} orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(255,255,255,0.4)" />
            </marker>
            <marker id="hld-arr-sel" viewBox="0 0 10 10" refX={8} refY={5}
              markerWidth={7} markerHeight={7} orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" fill={TOKENS.accent} />
            </marker>
          </defs>

          {/* Permanent edges */}
          {edges.map((edge) => {
            const fromNode = nodeMap[edge.from];
            const toNode   = nodeMap[edge.to];
            if (!fromNode || !toNode) return null;
            const { fx, fy, tx, ty, c1x, c1y, c2x, c2y } = edgePoints(fromNode, toNode);
            const isSelected = selectedEdge === edge.id;
            const midX = (fx + tx) / 2;
            const midY = (fy + ty) / 2;

            return (
              <g key={edge.id} style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge.id); }}>
                {/* Invisible wider hit area */}
                <path
                  d={`M ${fx} ${fy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`}
                  stroke="transparent"
                  strokeWidth={12}
                  fill="none"
                />
                {/* Visible edge */}
                <path
                  d={`M ${fx} ${fy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`}
                  stroke={isSelected ? TOKENS.accent : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  fill="none"
                  markerEnd={isSelected ? 'url(#hld-arr-sel)' : 'url(#hld-arr)'}
                />
                {/* Delete button on selected edge */}
                {isSelected && (
                  <g style={{ pointerEvents: 'all', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); deleteEdge(edge.id); }}>
                    <circle cx={midX} cy={midY} r={9} fill="#0e0f12" stroke={TOKENS.accent} strokeWidth={1.2} />
                    <text x={midX} y={midY + 4.5} fill={TOKENS.accent}
                      fontSize={12} textAnchor="middle" fontFamily={TOKENS.fontMono}>×</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Connection draft (while dragging handle) */}
          {draft && (
            <line
              x1={draft.fx} y1={draft.fy}
              x2={draft.cx} y2={draft.cy}
              stroke={TOKENS.accent}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              markerEnd="url(#hld-arr-sel)"
            />
          )}
        </svg>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            pointerEvents: 'none',
          }}>
            <p style={{
              fontFamily: TOKENS.fontHandwriting,
              fontSize: 24,
              color: 'rgba(255,255,255,0.18)',
              margin: 0,
            }}>
              Click a component type above to start your architecture
            </p>
            <p style={{
              fontFamily: TOKENS.fontMono,
              fontSize: 12,
              color: 'rgba(255,255,255,0.1)',
              margin: 0,
            }}>
              drag nodes to arrange · hover node edges to draw connections
            </p>
          </div>
        )}

        {/* Nodes */}
        {nodes.map((node) => (
          <DiagramNode
            key={node.id}
            node={node}
            isHovered={hovered === node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            onMouseDown={startDrag}
            onMouseUp={completeConnect}
            onLabelChange={updateLabel}
            onDelete={deleteNode}
            onStartConnect={startConnect}
          />
        ))}
      </div>
    </div>
  );
}

// ─── DiagramNode ──────────────────────────────────────────────────────────────

interface DiagramNodeProps {
  node: HLDNode;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onMouseUp: (nodeId: string) => void;
  onLabelChange: (nodeId: string, label: string) => void;
  onDelete: (nodeId: string) => void;
  onStartConnect: (e: React.MouseEvent, fromNodeId: string, fx: number, fy: number) => void;
}

function DiagramNode({
  node,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onLabelChange,
  onDelete,
  onStartConnect,
}: DiagramNodeProps) {
  const cfg      = NODE_CFG[node.type];
  const labelRef = useRef<HTMLDivElement>(null);

  // Sync label on mount
  useEffect(() => {
    if (labelRef.current && labelRef.current.textContent !== node.label) {
      labelRef.current.textContent = node.label;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]); // only on mount per node

  // Handle positions for this node (relative to BOARD, not node)
  const handles = [
    { side: 'N', x: node.x + NODE_W / 2, y: node.y },
    { side: 'S', x: node.x + NODE_W / 2, y: node.y + NODE_H },
    { side: 'E', x: node.x + NODE_W,     y: node.y + NODE_H / 2 },
    { side: 'W', x: node.x,              y: node.y + NODE_H / 2 },
  ];

  return (
    <>
      {/* Connection handles (shown on hover) */}
      {isHovered &&
        handles.map((h) => (
          <div
            key={h.side}
            onMouseDown={(e) => onStartConnect(e, node.id, h.x, h.y)}
            style={{
              position: 'absolute',
              left: h.x - 6,
              top: h.y - 6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: TOKENS.accent,
              border: '2px solid #0e0f12',
              cursor: 'crosshair',
              zIndex: 20,
            }}
          />
        ))}

      {/* Node box */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={(e) => onMouseDown(e, node.id)}
        onMouseUp={() => onMouseUp(node.id)}
        style={{
          position: 'absolute',
          left: node.x,
          top: node.y,
          width: NODE_W,
          minHeight: NODE_H,
          border: `1.8px solid ${cfg.border}`,
          borderRadius: '8px 10px 9px 8px',
          padding: '8px 28px 8px 12px',
          background: cfg.bg,
          cursor: 'grab',
          userSelect: 'none',
          zIndex: 10,
          boxShadow: isHovered ? `0 0 0 2px ${cfg.border}40` : 'none',
          transition: 'box-shadow 0.15s',
        }}
      >
        {/* Node type badge */}
        <span
          style={{
            display: 'block',
            fontFamily: TOKENS.fontMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: cfg.border,
            marginBottom: 2,
            opacity: 0.8,
          }}
        >
          {node.type}
        </span>

        {/* Editable label */}
        <div
          ref={labelRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="label"
          onMouseDown={(e) => e.stopPropagation()} // don't start node drag on text click
          onBlur={() => onLabelChange(node.id, labelRef.current?.textContent ?? '')}
          style={{
            fontFamily: TOKENS.fontHandwriting,
            fontSize: 22,
            color: TOKENS.text,
            outline: 'none',
            cursor: 'text',
            lineHeight: 1.2,
            minHeight: 26,
          }}
        />

        {/* Delete button */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(node.id)}
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 14,
            lineHeight: 1,
            padding: '2px 3px',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,80,80,0.8)')}
          onMouseOut={(e)  => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
        >
          ×
        </button>
      </div>
    </>
  );
}
