"use client";

import { useEffect, useState, useMemo } from 'react';
import StepByStepChat from './StepByStepChat';
import DiagramCanvas from './DiagramCanvas';
import { DiagramCanvasProvider, useDiagramCanvasRef } from './diagram/DiagramCanvasContext';
import { TimerWidget } from './TimerWidget';
import { HelpAssistant } from './HelpAssistant';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Download, Layout, Loader2, Menu, X } from 'lucide-react';
import { SystemDesignProblem } from '@/types';
import Link from 'next/link';
import { exportPracticeSession } from '@/lib/pdf-export-compact';
import { getThemeForProblem } from '@/lib/themes';
import { toast } from 'sonner';

import { useSession } from 'next-auth/react';

import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import { getDiagramStepKeysForProblem, isDiagramSubStep, resolvePhaseSteps } from '@/lib/step-journey';
import { exportSceneToPng, resolveBestDiagramSnapshot } from '@/lib/diagram-persistence';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/features';
import { SolutionViewer } from './SolutionViewer';
import { getSolution } from '@/lib/solutions';

import { startPracticeSession, togglePracticeTimer } from '@/app/actions/progress';
import { CheckCircle, Sparkles } from 'lucide-react';
import type { PracticeStepMode } from '@/lib/interview-lite-steps';
import { Badge } from '@/components/ui/badge';
import { StartInterviewDialog } from './StartInterviewDialog';
import InterviewSummaryPanel from './InterviewSummaryPanel';
import VoicePanel from './voice/VoicePanel';
import {
  interviewStatusReducer,
  interviewVariantUsesVoice,
  type InterviewConfig,
  type InterviewEvent,
  type InterviewStatus,
} from '@/lib/interview-mode';
import { PracticeAloudToggle } from './PracticeAloudToggle';

export default function PracticeUI({
  problem,
  stepMode = 'full',
  existingProgress,
  interviewConfig = null,
  interviewAllowed = false,
  probeEnabled = false,
  voiceEnabled = false,
}: {
  problem: SystemDesignProblem;
  stepMode?: PracticeStepMode;
  existingProgress?: any;
  interviewConfig?: InterviewConfig | null;
  interviewAllowed?: boolean;
  probeEnabled?: boolean;
  voiceEnabled?: boolean;
}) {
  return (
    <DiagramCanvasProvider>
      <PracticeUIContent
        problem={problem}
        stepMode={stepMode}
        existingProgress={existingProgress}
        interviewConfig={interviewConfig}
        interviewAllowed={interviewAllowed}
        probeEnabled={probeEnabled}
        voiceEnabled={voiceEnabled}
      />
    </DiagramCanvasProvider>
  );
}

function PracticeUIContent({
  problem,
  stepMode,
  existingProgress,
  interviewConfig = null,
  interviewAllowed = false,
  probeEnabled = false,
  voiceEnabled = false,
}: {
  problem: SystemDesignProblem;
  stepMode: PracticeStepMode;
  existingProgress?: any;
  interviewConfig?: InterviewConfig | null;
  interviewAllowed?: boolean;
  probeEnabled?: boolean;
  voiceEnabled?: boolean;
}) {
  const diagramRef = useDiagramCanvasRef();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session?.user?.id;

  const activeSteps = problem.steps || DEFAULT_PHASE_STEPS;

  const PHASES = Object.keys(activeSteps).map(key => {
    const steps = activeSteps[key];
    return steps.length > 0 ? steps[0].phase : key;
  });

  const [phase, setPhase] = useState<string>(PHASES[0] || 'Requirements');
  const [currentSubStep, setCurrentSubStep] = useState<string>('');
  const [currentStepKey, setCurrentStepKey] = useState<string>('');
  const [diagramCollapsed, setDiagramCollapsed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [savedStepData, setSavedStepData] = useState<Map<string, any>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  // Timer State
  const [serverStartedAt, setServerStartedAt] = useState<Date | string | null>((existingProgress as any)?.startedAt ?? null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>((existingProgress as any)?.isTimerRunning ?? true);
  const [serverPausedSeconds, setServerPausedSeconds] = useState<number>((existingProgress as any)?.totalPausedSeconds ?? 0);
  const [lastPausedAt, setLastPausedAt] = useState<Date | string | null>((existingProgress as any)?.lastPausedAt ?? null);
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>('running');
  const [practiceAloudOn, setPracticeAloudOn] = useState(false);
  const dispatchInterview = (event: InterviewEvent) =>
    setInterviewStatus((s) => interviewStatusReducer(s, event));

  // Reset interview session state whenever a fresh interview attempt starts
  // (guards against a stale 'complete'/'summary-error' status leaking across
  // re-entry into a new interview on the same mounted component instance).
  useEffect(() => {
    if (interviewConfig) {
      setInterviewStatus('running');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewConfig?.variant, problem.id]);

  // Clear the interview timer's local-storage state once a session ends, so a
  // later retry of the same problem+variant doesn't read stale finished/expired
  // timer state and start already-expired.
  useEffect(() => {
    if (!interviewConfig) return;
    if (interviewStatus === 'running') return;

    const interviewProblemId = `interview-${interviewConfig.variant}-${problem.id}`;
    try {
      localStorage.removeItem(`timer_${interviewProblemId}_status`);
      localStorage.removeItem(`timer_${interviewProblemId}_timeLeft`);
      localStorage.removeItem(`timer_${interviewProblemId}_lastTimestamp`);
    } catch (e) {
      console.error('Failed to clear stale interview timer state:', e);
    }
  }, [interviewStatus, interviewConfig, problem.id]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDiagramRelevant = isDiagramSubStep(currentSubStep);
  const phaseSteps = resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS);
  const diagramStepKeys = getDiagramStepKeysForProblem(phaseSteps);



  // Auto-mark in progress and START TIMER on mount (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated || !problem.id) return;

    const initSession = async () => {
      try {
        const result = await startPracticeSession(problem.id);

        if (result.success && result.startedAt) {
          setServerStartedAt(result.startedAt);
          setIsTimerRunning(result.isTimerRunning ?? true);
          setServerPausedSeconds(result.totalPausedSeconds ?? 0);
          setLastPausedAt(result.lastPausedAt ?? null);
        }
      } catch (error) {
        console.error("Failed to auto-start session:", error);
      }
    };
    initSession();
  }, [problem.id, isAuthenticated]);

  useEffect(() => {
        const handler = (e: any) => {
      if (e?.detail?.phase) setPhase(e.detail.phase);
      if (e?.detail?.subStep) setCurrentSubStep(e.detail.subStep);
      if (e?.detail?.stepKey) {
        setCurrentStepKey(e.detail.stepKey);
      }
      if (e?.detail?.completedSteps) setCompletedSteps(e.detail.completedSteps);
      if (e?.detail?.savedStepData) setSavedStepData(e.detail.savedStepData);
    };
    window.addEventListener('sd-phase-change', handler as EventListener);
    window.addEventListener('sd-progress-update', handler as EventListener);

    return () => {
      window.removeEventListener('sd-phase-change', handler as EventListener);
      window.removeEventListener('sd-progress-update', handler as EventListener);
    };
  }, []);

  const theme = getThemeForProblem(problem.slug);
  const Icon = theme.icon;

  const [isSolutionOpen, setIsSolutionOpen] = useState(false);
  const [showSolutionConfirm, setShowSolutionConfirm] = useState(false);
  const solution = FEATURES.solutionViewer ? getSolution(problem.slug) : null;
  const hasPlatformPlan = session?.user?.hasPlatformPlan ?? false;

  const totalSteps = useMemo(
    () => Object.values(activeSteps).reduce((sum, steps) => sum + steps.length, 0),
    [activeSteps]
  );

  const attemptedStepCount = useMemo(() => {
    let count = 0;
    savedStepData.forEach((data) => {
      if (
        data?.completed ||
        data?.feedback ||
        data?.textInput?.trim() ||
        (Array.isArray(data?.listItems) && data.listItems.length > 0) ||
        (Array.isArray(data?.schemaData) && data.schemaData.length > 0)
      ) {
        count += 1;
      }
    });
    return count;
  }, [savedStepData]);

  const isFullyComplete = completedSteps.length >= totalSteps && totalSteps > 0;

  const handleUnlockSolution = () => {
    if (!solution) return;
    if (hasPlatformPlan || isFullyComplete) {
      setIsSolutionOpen(true);
      return;
    }
    setShowSolutionConfirm(true);
  };

  const confirmViewSolution = () => {
    setShowSolutionConfirm(false);
    setIsSolutionOpen(true);
  };

  const exportTranscript = async () => {
    setIsExporting(true);
    try {
      const getDiagramPng = async (): Promise<Blob | null> => {
        const snapshot = resolveBestDiagramSnapshot(diagramStepKeys, savedStepData);
        if (snapshot?.imageData) {
          const res = await fetch(snapshot.imageData);
          return res.blob();
        }
        if (snapshot?.scene) {
          const fromScene = await exportSceneToPng(snapshot.scene);
          if (fromScene) return fromScene;
        }
        return diagramRef.current?.getPng() ?? null;
      };

      await exportPracticeSession({ problem, savedStepData, getDiagramPng });
      toast.success('PDF exported successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF. Please try again or contact support if the issue persists.');
    } finally {
      setIsExporting(false);
    }
  };

  // Reusable Sidebar Content
  const renderSidebar = () => (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-xl">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3 mb-6 min-w-0">
          <Link href="/" className="hover:opacity-80 transition-opacity shrink-0">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient} shadow-md text-white`}>
              <Icon className="h-5 w-5" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate leading-tight">
              {problem.title}
            </h1>
            <p className="text-xs text-muted-foreground truncate">System Design Practice</p>
            {stepMode === 'lite' && (
              <Badge
                variant="outline"
                className="mt-1.5 text-[10px] border-sky-500/30 text-sky-600 bg-sky-500/10"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Interview Lite · 45 min
              </Badge>
            )}
            {interviewConfig && (
              <Badge
                variant="outline"
                className="mt-1.5 text-[10px] border-red-500/30 text-red-600 bg-red-500/10"
              >
                Interview · {interviewConfig.durationSeconds / 60} min
              </Badge>
            )}
          </div>
        </div>

        {/* Interview Timer */}
        <div className="mb-4">
          {interviewConfig && interviewStatus === 'running' ? (
            <TimerWidget
              className="w-full justify-between"
              problemId={`interview-${interviewConfig.variant}-${problem.id}`}
              initialTimeSeconds={interviewConfig.durationSeconds}
              onComplete={() => {
                toast.warning("Time's up! Your interview has ended.");
                dispatchInterview('TIME_EXPIRED');
              }}
            />
          ) : !interviewConfig ? (
            <TimerWidget
              className="w-full justify-between"
              problemId={problem.id}
              initialTimeSeconds={
                stepMode === 'lite' ? 2700 :
                problem.difficulty === 'Easy' ? 1800 :
                  problem.difficulty === 'Medium' ? 2700 :
                    3600
              }
              startedAt={serverStartedAt}
              isTimerRunning={isTimerRunning}
              totalPausedSeconds={serverPausedSeconds}
              lastPausedAt={lastPausedAt}
              onToggle={async () => {
                if (!isAuthenticated) return;
                const result = await togglePracticeTimer(problem.id);
                if (result.success) {
                  setIsTimerRunning(result.isTimerRunning ?? false);
                  setServerPausedSeconds(result.totalPausedSeconds ?? 0);
                  setLastPausedAt(result.lastPausedAt ?? null);
                }
              }}
              onComplete={async () => {
                toast.warning("Time's up! The practice session has ended.");
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="space-y-1">
          {Object.entries(activeSteps).map(([phaseKey, steps], idx) => {
            const phaseTitle = steps.length > 0 ? steps[0].phase : phaseKey;
            const isPhaseActive = phaseTitle === phase;

            return (
              <div key={phaseKey} className="mb-4">
                <div className="px-2 mb-2 flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isPhaseActive ? 'text-primary' : 'text-muted-foreground opacity-70'}`}>
                    {idx + 1}. {phaseTitle}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {steps.map((step, stepIndex) => {
                    const stepKey = `${phaseKey}-${stepIndex}`;
                    const data = savedStepData.get(stepKey);
                    const isCompleted = data?.completed;
                    const isFailed = data?.feedback && !data.feedback.isAcceptable;
                    const isCurrent = stepKey === currentStepKey;

                    return (
                      <button
                        key={stepIndex}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('sd-navigate-step', {
                            detail: { phase: phaseKey, stepIndex }
                          }));
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left group
                          ${isCurrent
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }
                        `}
                      >
                        <div className={`
                          w-5 h-5 rounded-full flex items-center justify-center text-[10px] border shrink-0 transition-colors
                          ${isCurrent
                            ? 'border-primary bg-background shadow-sm text-primary'
                            : isCompleted
                              ? 'bg-green-500/10 border-green-500/20 text-green-600'
                              : isFailed
                                ? 'bg-red-500/10 border-red-500/20 text-red-600'
                                : 'border-muted bg-muted/20 text-muted-foreground group-hover:border-foreground/20'
                          }
                        `}>
                          {isCompleted ? <CheckCircle className="h-3 w-3" /> :
                            isFailed ? <X className="h-3 w-3" /> :
                              isCurrent ? <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> :
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">•</span>
                          }
                        </div>

                        <span className={`truncate ${isCompleted || isFailed ? 'opacity-80' : ''}`}>
                          {step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="p-4 border-t border-border/50 space-y-2 bg-muted/10 shrink-0">
        {FEATURES.solutionViewer && (
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-start ${!solution ? 'opacity-50' : 'hover:bg-amber-500/10 hover:text-amber-600'}`}
            onClick={handleUnlockSolution}
            disabled={!solution}
            title={
              solution && !hasPlatformPlan && !isFullyComplete
                ? 'Complete the problem or upgrade to view the expert solution'
                : undefined
            }
          >
            {solution ? 'View Solution' : 'Solution Unavailable'}
          </Button>
        )}

        {!interviewConfig && (
          <PracticeAloudToggle
            enabled={practiceAloudOn}
            entitled={voiceEnabled}
            onEnabledChange={setPracticeAloudOn}
          />
        )}

        {interviewAllowed && !interviewConfig && (
          <StartInterviewDialog
            slug={problem.slug}
            interviewEntitled={interviewAllowed}
            voiceEntitled={voiceEnabled}
          />
        )}

        {interviewConfig && interviewStatus === 'running' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-red-600 border-red-500/30 hover:bg-red-500/10"
            onClick={() => dispatchInterview('FINISH_EARLY')}
          >
            End Interview
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={exportTranscript}
          disabled={isExporting}
          className="w-full justify-start hover:bg-muted"
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
          Export PDF
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background overflow-hidden">

      {/* Mobile Header */}
      <div className="md:hidden h-14 border-b border-border flex items-center px-4 bg-background/80 backdrop-blur-md shrink-0 justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 shrink-0" aria-label="Toggle menu" title="Toggle menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 border-r border-border">
                {renderSidebar()}
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="-ml-2 shrink-0" aria-label="Toggle menu" title="Toggle menu">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <span className="font-semibold text-sm truncate flex-1">{problem.title}</span>
        </div>
        <Link href="/" className="shrink-0 ml-2">
          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${theme.gradient} shadow-sm text-white`}>
            <Icon className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* Desktop Sidebar - Fixed Left */}
      <aside className="hidden md:flex w-80 border-r border-border flex-col shrink-0">
        {renderSidebar()}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 relative">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">

          {(interviewConfig && interviewVariantUsesVoice(interviewConfig.variant)) ||
          (!interviewConfig && practiceAloudOn && voiceEnabled) ? (
            <VoicePanel
              slug={problem.slug}
              problemTitle={problem.title}
              practiceSessionId={existingProgress?.activeSessionId ?? null}
            />
          ) : null}

          {/* Main Chat Interface */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <StepByStepChat problem={problem} probeEnabled={probeEnabled} />
          </div>

          {/* Diagram Section — always mounted when stepKey is set */}
          {currentStepKey && (
            <div className="mt-8 animate-fade-in space-y-4">
              {isDiagramRelevant && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Layout className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">System Diagram</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDiagramCollapsed(!diagramCollapsed)}
                    className="text-xs"
                  >
                    {diagramCollapsed ? 'Show Canvas' : 'Hide Canvas'}
                  </Button>
                </div>
              )}

              <div
                className={cn(
                  'transition-all duration-300 border-2 border-border/60 rounded-xl overflow-hidden shadow-sm bg-card flex flex-col min-h-0',
                  !isDiagramRelevant || diagramCollapsed
                    ? 'h-0 opacity-0 overflow-hidden pointer-events-none border-0'
                    : 'h-[600px] opacity-100'
                )}
              >
                <DiagramCanvas
                  stepKey={currentStepKey}
                  isVisible={isDiagramRelevant && !diagramCollapsed}
                />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Help Assistant */}
      {!interviewConfig && (
        <HelpAssistant
          problem={problem}
          currentPhase={phase}
          completedSteps={completedSteps}
          savedStepData={savedStepData}
        />
      )}


      {interviewConfig && interviewStatus !== 'running' && (
        <InterviewSummaryPanel
          problem={problem}
          phaseSteps={phaseSteps}
          savedStepData={savedStepData}
          status={interviewStatus}
          onSummaryReady={() => dispatchInterview('SUMMARY_READY')}
          onSummaryFailed={() => dispatchInterview('SUMMARY_FAILED')}
          onRetry={() => dispatchInterview('RETRY_SUMMARY')}
          onExportPdf={exportTranscript}
          isExporting={isExporting}
          interviewVariant={interviewConfig.variant}
        />
      )}

      {FEATURES.solutionViewer && (
        <>
          <SolutionViewer
            isOpen={isSolutionOpen}
            onClose={() => setIsSolutionOpen(false)}
            solution={solution}
          />

          <Dialog open={showSolutionConfirm} onOpenChange={setShowSolutionConfirm}>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>View expert solution?</DialogTitle>
                <DialogDescription>
                  {attemptedStepCount === 0
                    ? 'You have not submitted any answers yet. Try at least one step on your own before viewing the full solution — it will be much more valuable.'
                    : `You have completed ${completedSteps.length} of ${totalSteps} steps. Viewing the solution now will reveal the full answer and may reduce the learning benefit of this practice session.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSolutionConfirm(false)}>
                  Keep practicing
                </Button>
                <Button
                  variant={attemptedStepCount === 0 ? 'outline' : 'default'}
                  className={attemptedStepCount === 0 ? 'text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-950' : undefined}
                  onClick={confirmViewSolution}
                >
                  {attemptedStepCount === 0 ? 'View anyway' : 'View solution'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div >
  );
}
