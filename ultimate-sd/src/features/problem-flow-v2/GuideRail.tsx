'use client';

/**
 * GuideRail — 292px right panel
 *
 * Sections:
 *   - FOCUS ON:   primary tips for the current stage
 *   - WORTH CONSIDERING: secondary suggestions
 *   - AI FEEDBACK: 3-state (idle → loading/shimmer → done)
 *
 * Spec: §3.4 Guide Rail
 */

import type {
  FeedbackState,
  Seniority,
  StageFeedback,
  StageGuideContent,
  StageIndex,
} from './data/canvas-types';

interface GuideRailProps {
  stage: StageIndex;
  seniority: Seniority;
  guide: ProblemCanvasData['guide'];
  feedbackState: FeedbackState;
  feedbackContent: StageFeedback | undefined;
  onRequestFeedback: () => void;
}

// Inline the type to avoid circular import
type ProblemCanvasData = {
  guide: [
    StageGuideContent,
    StageGuideContent,
    StageGuideContent,
    StageGuideContent,
    StageGuideContent,
    StageGuideContent,
    StageGuideContent,
  ];
};

export function GuideRail({
  stage,
  guide,
  feedbackState,
  feedbackContent,
  onRequestFeedback,
}: GuideRailProps) {
  const g = guide[stage];

  return (
    <aside
      style={{
        width: 292,
        flexShrink: 0,
        background: '#12141a',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        {/* FOCUS ON */}
        <Section label="FOCUS ON">
          {g.tips.map((tip, i) => (
            <Tip key={i} color="#8fc7a6" text={tip} />
          ))}
        </Section>

        {/* WORTH CONSIDERING */}
        {g.suggestions.length > 0 && (
          <Section label="WORTH CONSIDERING">
            {g.suggestions.map((s, i) => (
              <Tip key={i} color="#d9c08a" text={s} />
            ))}
          </Section>
        )}

        {/* AI FEEDBACK */}
        <Section label="AI FEEDBACK">
          <FeedbackPanel
            state={feedbackState}
            content={feedbackContent}
            prompt={g.feedbackPrompt}
            onRequest={onRequestFeedback}
          />
        </Section>
      </div>
    </aside>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
          margin: '0 0 10px',
        }}
      >
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Tip ─────────────────────────────────────────────────────────────────────

function Tip({ color, text }: { color: string; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: color,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: 12,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.72)',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Feedback Panel ───────────────────────────────────────────────────────────

import React from 'react';

function FeedbackPanel({
  state,
  content,
  prompt,
  onRequest,
}: {
  state: FeedbackState;
  content: StageFeedback | undefined;
  prompt: string;
  onRequest: () => void;
}) {
  if (state === 'idle') {
    return (
      <div>
        <p
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          {prompt}
        </p>
        <button
          onClick={onRequest}
          style={{
            background: 'rgba(143,149,242,0.12)',
            border: '1px solid rgba(143,149,242,0.25)',
            borderRadius: 8,
            cursor: 'pointer',
            padding: '8px 14px',
            fontFamily: 'Geist Mono, monospace',
            fontSize: 12,
            fontWeight: 600,
            color: '#8f95f2',
            width: '100%',
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(143,149,242,0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(143,149,242,0.12)')}
        >
          ✦ Get AI feedback
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[100, 70, 90, 55].map((w, i) => (
          <div
            key={i}
            style={{
              height: 10,
              width: `${w}%`,
              borderRadius: 5,
              background: 'rgba(255,255,255,0.06)',
              animation: 'shimmer 1.4s ease infinite',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
        <p
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
            marginTop: 4,
          }}
        >
          Analyzing your approach…
        </p>
      </div>
    );
  }

  // done
  return (
    <div
      style={{
        background: 'rgba(143,199,166,0.08)',
        border: '1px solid rgba(143,199,166,0.2)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      {content?.label && (
        <p
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            color: '#8fc7a6',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {content.label}
        </p>
      )}
      <p
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: 12,
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.72)',
          margin: 0,
        }}
      >
        {content?.body ?? ''}
      </p>
    </div>
  );
}
