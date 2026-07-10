'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { ForgeCanvasProvider, useForgeCanvasRef } from './ForgeCanvasContext';
import { JourneyMap } from './JourneyMap';
import { GuidancePanel } from './GuidancePanel';
import { ForgeCoach } from './ForgeCoach';
import { ProblemImmersion } from './ProblemImmersion';
import { FeedbackOverlay } from './FeedbackOverlay';
import { SeniorityCalibrationModal } from './SeniorityCalibrationModal';
import { ForgeSessionComplete } from './ForgeSessionComplete';
import { TimerWidget } from '@/components/TimerWidget';
import { Button } from '@/components/ui/button';
import type { SystemDesignProblem, ParsedFeedback } from '@/types';
import type { PracticeStepMode } from '@/lib/interview-lite-steps';
import type { SeniorityLevel } from '@/lib/forge/types';
import { buildStandardForgeJourney } from '@/lib/forge/standard-journey';
import { spawnSessionFrames } from '@/lib/forge/frame-manager';
import { ForgeExportMenu } from './ForgeExportMenu';
import { isForgeSessionComplete, averageStepScore } from '@/lib/forge/forge-progress';
import {
  initForgeSession,
  loadForgeSession,
  saveForgeSession,
  updateForgeScene,
  resolveForgeInitialScene,
} from '@/lib/forge/forge-session';
import { trimSceneForDbSnapshot } from '@/lib/diagram-persistence';
import { fetchWithRetry } from '@/lib/fetchUtils';
import { awardStepXp, completeSession, saveForgeDiagramSnapshot, startPracticeSession } from '@/app/actions/progress';
import type { ExcalidrawScene } from '@/types/diagram';

const ForgeCanvas = dynamic(() => import('./ForgeCanvas'), { ssr: false });

type ForgePracticeUIProps = {
  problem: SystemDesignProblem;
  stepMode?: PracticeStepMode;
  existingProgress?: {
    startedAt?: Date | string | null;
    isTimerRunning?: boolean;
    totalPausedSeconds?: number;
    lastPausedAt?: Date | string | null;
  } | null;
  serverDiagramSnapshot?: unknown;
  designForgeAllowed?: boolean;
};

export default function ForgePracticeUI(props: ForgePracticeUIProps) {
  return (
    <ForgeCanvasProvider>
      <ForgePracticeUIContent {...props} />
    </ForgeCanvasProvider>
  );
}

function ForgePracticeUIContent({
  problem,
  existingProgress,
  serverDiagramSnapshot,
  designForgeAllowed = false,
}: ForgePracticeUIProps) {
  const forgeRef = useForgeCanvasRef();
  const journey = useMemo(
    () => buildStandardForgeJourney(problem),
    [problem]
  );

  const [session, setSession] = useState(() => {
    const saved = loadForgeSession(problem.slug);
    return saved ?? initForgeSession(problem.slug);
  });
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(session.sessionComplete);

  const restoredScene = useMemo(
    () => resolveForgeInitialScene(session, serverDiagramSnapshot),
    [session, serverDiagramSnapshot]
  );

  const [showImmersion, setShowImmersion] = useState(!session.immersionComplete);
  const [showSeniorityModal, setShowSeniorityModal] = useState(false);
  const [journeyCollapsed, setJourneyCollapsed] = useState(false);
  const [guidanceCollapsed, setGuidanceCollapsed] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [feedback, setFeedback] = useState<ParsedFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectionText, setSelectionText] = useState('');

  const activeStep = journey[session.activeStepIndex] ?? null;

  const initialElements = useMemo(
    () => spawnSessionFrames(journey, problem, session.seniority, session.activeStepIndex),
    [journey, problem, session.seniority, session.activeStepIndex]
  );

  useEffect(() => {
    startPracticeSession(problem.id).then((result) => {
      if (result.success && result.sessionId) {
        setPracticeSessionId(result.sessionId);
      }
    }).catch(console.error);
  }, [problem.id]);

  useEffect(() => {
    if (!showImmersion && !showSeniorityModal && activeStep) {
      const timer = setTimeout(() => forgeRef.current?.focusFrame(activeStep.frameId), 500);
      return () => clearTimeout(timer);
    }
  }, [showImmersion, showSeniorityModal, activeStep, forgeRef]);

  const persistSession = useCallback((patch: Partial<typeof session>) => {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      saveForgeSession(next);
      return next;
    });
  }, []);

  const handleSceneChange = useCallback((scene: ExcalidrawScene) => {
    setSession((prev) => {
      const next = updateForgeScene(prev, scene);
      saveForgeSession(next);
      return next;
    });
  }, []);

  const serverSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleServerSave = useCallback(
    (scene: ExcalidrawScene) => {
      if (serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);
      serverSaveTimerRef.current = setTimeout(() => {
        saveForgeDiagramSnapshot(problem.id, trimSceneForDbSnapshot(scene)).catch(() => {
          // Best-effort server backup
        });
        serverSaveTimerRef.current = null;
      }, 5000);
    },
    [problem.id]
  );

  const handleSceneChangeWithBackup = useCallback(
    (scene: ExcalidrawScene) => {
      handleSceneChange(scene);
      scheduleServerSave(scene);
    },
    [handleSceneChange, scheduleServerSave]
  );

  const enterCanvas = useCallback(() => {
    persistSession({ immersionComplete: true });
    setShowImmersion(false);
    if (!session.seniorityCalibrated) {
      setShowSeniorityModal(true);
    }
  }, [persistSession, session.seniorityCalibrated]);

  const handleStartDesigning = () => {
    enterCanvas();
  };

  const handleSeniorityContinue = () => {
    persistSession({ seniorityCalibrated: true });
    setShowSeniorityModal(false);
    if (activeStep) {
      setTimeout(() => forgeRef.current?.focusFrame(activeStep.frameId), 300);
    }
  };

  const handleSenioritySkip = () => {
    persistSession({ seniorityCalibrated: true });
    setShowSeniorityModal(false);
  };

  const handleStepSelect = (stepIndex: number) => {
    const step = journey[stepIndex];
    if (!step) return;
    persistSession({ activeStepIndex: stepIndex });
    forgeRef.current?.focusFrame(step.frameId);
  };

  const handleSeniorityChange = (seniority: SeniorityLevel) => {
    persistSession({ seniority });
  };

  const getCoachContext = useCallback(() => {
    const selection = forgeRef.current?.getSelectionText() ?? selectionText;
    const frame = activeStep ? forgeRef.current?.getFrameText(activeStep.frameId) ?? '' : '';
    if (selection) return `[Selected on canvas]\n${selection}`;
    if (frame) return frame;
    return '';
  }, [activeStep, selectionText]);

  const handleReviewStep = async () => {
    if (!activeStep) return;
    setIsReviewing(true);

    const frameText = forgeRef.current?.getFrameText(activeStep.frameId) ?? '';
    const userAnswer = frameText || '(No text content in frame yet — add requirements on the canvas)';

    try {
      const res = await fetchWithRetry('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problem.slug,
          phase: activeStep.phase,
          phaseKey: activeStep.phaseKey,
          subStep: activeStep.subStep,
          userAnswer,
          problemDetails: problem,
        }),
        retries: 2,
        timeout: 15000,
      });

      const data = await res.json();
      setFeedback(data.feedback);
      setShowFeedback(true);

      if (activeStep) {
        forgeRef.current?.applyFeedbackAnnotations(activeStep.frameId, activeStep.stepId, data.feedback);
      }

      if (data.feedback?.isAcceptable) {
        const stepScores = {
          ...session.stepScores,
          [activeStep.stepId]: data.feedback.score ?? 0,
        };
        persistSession({ stepScores });

        const alreadyDone = session.completedStepIds.includes(activeStep.stepId);
        if (!alreadyDone) {
          const completedStepIds = [...session.completedStepIds, activeStep.stepId];
          const allComplete = isForgeSessionComplete(completedStepIds, journey);
          const nextIndex = allComplete
            ? session.activeStepIndex
            : Math.min(session.activeStepIndex + 1, journey.length - 1);

          persistSession({
            completedStepIds,
            activeStepIndex: nextIndex,
            sessionComplete: allComplete,
          });

          if (allComplete) {
            setShowComplete(true);
            const scene = forgeRef.current?.getScene();
            const avg = averageStepScore(stepScores);
            if (practiceSessionId && avg !== null) {
              completeSession(
                practiceSessionId,
                avg,
                scene ? trimSceneForDbSnapshot(scene) : undefined
              ).catch(console.error);
            }
            toast.success('Architecture complete!');
          }

          const nextStep = journey[nextIndex];
          if (!allComplete) {
            forgeRef.current?.activateFrameTransition(
              activeStep.frameId,
              nextStep && nextIndex !== session.activeStepIndex ? nextStep.frameId : null
            );
          }

          try {
            const result = await awardStepXp(problem.id, activeStep.stepId);
            if (result.success && result.xpAwarded) {
              toast.success(`Step complete! +${result.xpAwarded} XP`);
            }
          } catch {
            // XP is best-effort
          }

          if (nextStep && nextIndex !== session.activeStepIndex && !allComplete) {
            setTimeout(() => forgeRef.current?.focusFrame(nextStep.frameId), 400);
          }
        }
      }
    } catch (err) {
      toast.error('Review failed — try again');
      console.error(err);
    } finally {
      setIsReviewing(false);
    }
  };

  if (showImmersion) {
    return (
      <ProblemImmersion
        problem={problem}
        seniority={session.seniority}
        onSeniorityChange={handleSeniorityChange}
        onStart={handleStartDesigning}
      />
    );
  }

  if (showComplete && isForgeSessionComplete(session.completedStepIds, journey)) {
    return (
      <ForgeSessionComplete
        problem={problem}
        journey={journey}
        stepScores={session.stepScores}
        onReviewCanvas={() => setShowComplete(false)}
        onExportPng={async () => {
          const blob = await forgeRef.current?.exportPng();
          if (!blob) {
            toast.error('Nothing to export');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${problem.slug}-forge.png`;
          link.click();
          URL.revokeObjectURL(url);
        }}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background" data-testid="forge-practice-ui">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/problems">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Problems
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{problem.title}</h1>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            DesignForge
          </span>
          {designForgeAllowed && (
            <Link
              href={`/practice/${problem.slug}`}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Classic UI
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <TimerWidget
            className="justify-between"
            problemId={problem.id}
            initialTimeSeconds={
              problem.difficulty === 'Easy' ? 1800 :
              problem.difficulty === 'Medium' ? 2700 :
              3600
            }
            startedAt={existingProgress?.startedAt}
            isTimerRunning={existingProgress?.isTimerRunning}
            totalPausedSeconds={existingProgress?.totalPausedSeconds}
            lastPausedAt={existingProgress?.lastPausedAt}
          />
          <ForgeExportMenu problemTitle={problem.title} />
        </div>
      </header>

      <p
        className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100 md:hidden"
        data-testid="forge-mobile-companion"
      >
        Canvas works best on tablet or desktop — your progress saves automatically if you switch devices.
      </p>

      <div className="flex min-h-0 flex-1">
        <JourneyMap
          journey={journey}
          activeStepIndex={session.activeStepIndex}
          completedStepIds={session.completedStepIds}
          seniority={session.seniority}
          collapsed={journeyCollapsed}
          onToggleCollapse={() => setJourneyCollapsed((v) => !v)}
          onStepSelect={handleStepSelect}
          onSeniorityChange={handleSeniorityChange}
        />

        <main className="relative min-w-0 flex-1">
          <ForgeCanvas
            initialElements={initialElements}
            restoredScene={restoredScene}
            onSceneChange={handleSceneChangeWithBackup}
            onSelectionChange={setSelectionText}
          />
          {showFeedback && feedback && activeStep && (
            <FeedbackOverlay
              step={activeStep}
              feedback={feedback}
              onDismiss={() => setShowFeedback(false)}
              canContinue={feedback.isAcceptable === true && session.activeStepIndex < journey.length - 1}
              onContinue={() => {
                setShowFeedback(false);
                const next = journey[session.activeStepIndex + 1];
                if (next) forgeRef.current?.focusFrame(next.frameId);
              }}
            />
          )}
        </main>

        <GuidancePanel
          step={activeStep}
          collapsed={guidanceCollapsed}
          onToggleCollapse={() => setGuidanceCollapsed((v) => !v)}
          onReviewStep={handleReviewStep}
          isReviewing={isReviewing}
        />
      </div>

      <ForgeCoach
        problem={problem}
        currentStep={activeStep}
        getContextText={getCoachContext}
        completedStepIds={session.completedStepIds}
      />

      <SeniorityCalibrationModal
        open={showSeniorityModal}
        value={session.seniority}
        onChange={handleSeniorityChange}
        onContinue={handleSeniorityContinue}
        onSkip={handleSenioritySkip}
      />
    </div>
  );
}
