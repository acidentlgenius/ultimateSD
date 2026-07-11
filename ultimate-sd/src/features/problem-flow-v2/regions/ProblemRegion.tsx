'use client';

/**
 * Region 0 — Problem Card
 * Position: left=120px, top=170px, width=470px
 * Always visible (maxStage >= 0)
 */

import { useState } from 'react';
import type { ProblemStageData } from '../data/canvas-types';
import { TOKENS } from './shared';

interface ProblemRegionProps {
  data: ProblemStageData;
  isActive: boolean;
}

export function ProblemRegion({ data }: ProblemRegionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 170,
        width: 470,
        background: '#15161c',
        border: '1px solid rgba(255,255,255,.09)',
        borderRadius: 12,
        boxShadow: '0 16px 40px rgba(0,0,0,.4)',
        padding: collapsed ? '14px 18px' : '22px 24px 20px',
        transition: 'padding 0.2s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : 10 }}>
        <span
          style={{
            fontFamily: TOKENS.fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          PROBLEM
        </span>
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 11,
            fontFamily: TOKENS.fontMono,
            padding: '2px 6px',
          }}
          aria-label={collapsed ? 'Expand problem card' : 'Collapse problem card'}
        >
          {collapsed ? 'expand ▴' : 'collapse ▾'}
        </button>
      </div>

      {/* Title — always visible */}
      <h3
        style={{
          fontFamily: TOKENS.fontMono,
          fontSize: 20,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.95)',
          margin: collapsed ? 0 : '0 0 10px',
          lineHeight: 1.3,
        }}
      >
        {data.title}
      </h3>

      {/* Body — hidden when collapsed */}
      {!collapsed && (
        <>
          <p
            style={{
              fontFamily: TOKENS.fontMono,
              fontSize: 14,
              color: '#b3b6bf',
              lineHeight: 1.65,
              margin: '0 0 12px',
            }}
          >
            {data.context}
          </p>

          <div
            style={{
              background: 'rgba(143,149,242,0.06)',
              border: '1px solid rgba(143,149,242,0.15)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontFamily: TOKENS.fontMono,
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: '#8f95f2', fontWeight: 700 }}>Scope: </span>
              {data.scopeNote}
            </p>
          </div>

          <p
            style={{
              fontFamily: TOKENS.fontMono,
              fontSize: 11.5,
              color: '#5f636c',
              margin: 0,
            }}
          >
            Collapses into the guide rail once read.
          </p>
        </>
      )}
    </div>
  );
}
