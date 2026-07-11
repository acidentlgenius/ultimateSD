'use client';

/**
 * CanvasSessionUI — V2 root component
 *
 * Composes: TopBar + CanvasArea + GuideRail + BottomDock + StepExplainCard
 *
 * This is the ONLY V2 component that should be imported by the practice page.
 * Feature flag gating happens in the practice page, not here.
 *
 * Props mirror what the practice page already fetches (problem, userId, snapshot).
 */

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCanvasData } from './data/canvas-data';
import type { CanvasSnapshot, StageIndex } from './data/canvas-types';
import { useCanvasSession } from './hooks/useCanvasSession';
import { useCanvasContent } from './hooks/useCanvasContent';
import { TopBar } from './TopBar';
import { BottomDock } from './BottomDock';
import { CanvasArea } from './CanvasArea';
import { GuideRail } from './GuideRail';
import { StepExplainCard } from './StepExplainCard';

interface CanvasSessionUIProps {
  /** Problem URL slug — e.g. "design-youtube" */
  slug: string;
  /** Problem display title */
  title: string;
  /** DB problem id (UUID) for persistence */
  problemId: string;
  /** Authenticated user id */
  userId: string;
  /** Optional saved snapshot from previous session */
  snapshot?: CanvasSnapshot | null;
}

export default function CanvasSessionUI({
  slug,
  title,
  problemId,
  userId,
  snapshot,
}: CanvasSessionUIProps) {
  const router = useRouter();
  const data = getCanvasData(slug);

  // Restore stage and seniority from snapshot if available
  const initialStage = (snapshot?.stage ?? 0) as StageIndex;
  const initialSeniority = snapshot?.seniority ?? 'mid';

  const session = useCanvasSession(initialStage, initialSeniority);
  const { state } = session;

  // Snapshot getter for persistence (stable reference via ref)
  const stateRef = useRef(state);
  stateRef.current = state;
  const getSnapshot = useCallback(
    () => ({
      stage: stateRef.current.stage,
      maxStage: stateRef.current.maxStage,
      seniority: stateRef.current.seniority,
    }),
    [],
  );

  const content = useCanvasContent(
    problemId,
    userId,
    getSnapshot,
    snapshot?.content,
  );

  const handleExit = useCallback(() => {
    router.push(`/practice/${slug}`);
  }, [router, slug]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0e0f12',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Geist Mono, monospace',
        // Push canvas below top bar and above bottom dock
        paddingTop: 52,
        paddingBottom: 56,
      }}
    >
      {/* Top chrome */}
      <TopBar
        problemTitle={title}
        stage={state.stage}
        maxStage={state.maxStage}
        secondsLeft={state.secondsLeft}
        timerRunning={state.timerRunning}
        seniority={state.seniority}
        guideOpen={state.guideOpen}
        isSaving={content.isSaving}
        onNavigate={session.goToStage}
        onToggleTimer={session.toggleTimer}
        onSeniorityChange={session.setSeniority}
        onToggleGuide={session.toggleGuide}
        onExit={handleExit}
      />

      {/* Main body: canvas + optional guide rail */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <CanvasArea data={data} session={session} content={content} />

        {state.guideOpen && (
          <GuideRail
            stage={state.stage}
            seniority={state.seniority}
            guide={data.guide}
            feedbackState={state.feedback[state.stage]}
            feedbackContent={state.feedbackContent[state.stage]}
            onRequestFeedback={async () => {
              session.setFeedback(state.stage, 'loading');
              try {
                const res = await fetch('/api/canvas/feedback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    stage: state.stage,
                    seniority: state.seniority,
                    slug,
                    content: content.content,
                  }),
                });
                if (!res.ok) throw new Error('Feedback request failed');
                const json = await res.json();
                session.setFeedback(state.stage, 'done', json.body, json.label);
              } catch {
                session.setFeedback(state.stage, 'idle');
              }
            }}
          />
        )}
      </div>

      {/* Bottom chrome */}
      <BottomDock
        stage={state.stage}
        maxStage={state.maxStage}
        secondsLeft={state.secondsLeft}
        onNext={session.nextStage}
        onPrev={session.prevStage}
        onNavigate={session.goToStage}
      />

      {/* Step explain card — modal */}
      <StepExplainCard
        stage={state.stage}
        isOpen={state.explainOpen}
        onDismiss={session.dismissExplain}
      />
    </div>
  );
}
