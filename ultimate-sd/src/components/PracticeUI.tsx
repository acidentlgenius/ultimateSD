"use client";

import { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react';
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
import { Download, Loader2, Menu, X, ArrowLeft, PanelLeftOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { SystemDesignProblem } from '@/types';
import Link from 'next/link';
import { exportPracticeSession } from '@/lib/pdf-export-compact';
import { getThemeForProblem } from '@/lib/themes';
import { toast } from 'sonner';

import { useSession } from 'next-auth/react';

import { getDiagramStepKeysForProblem, getGenericFallbackSteps, isDiagramSubStep, resolvePhaseSteps } from '@/lib/step-journey';
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
import { PracticeTour } from './PracticeTour';
import { Compass } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { ProblemIntroStep } from './ProblemIntroStep';
import { introSeenKey, shouldAutoShowIntro } from '@/lib/problem-intro';
import type { ProblemIntroContent } from '@/types';
import { BookOpen } from 'lucide-react';
import { parseStepKey } from '@/lib/pdf-export-helpers';
import { PracticeProgress } from '@/components/PracticeProgress';

export default function PracticeUI({
  problem,
  stepMode = 'full',
  existingProgress,
  interviewConfig = null,
  interviewAllowed = false,
  probeEnabled = false,
  voiceEnabled = false,
  intro = null,
}: {
  problem: SystemDesignProblem;
  stepMode?: PracticeStepMode;
  existingProgress?: any;
  interviewConfig?: InterviewConfig | null;
  interviewAllowed?: boolean;
  probeEnabled?: boolean;
  voiceEnabled?: boolean;
  intro?: ProblemIntroContent | null;
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
        intro={intro}
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
  intro = null,
}: {
  problem: SystemDesignProblem;
  stepMode: PracticeStepMode;
  existingProgress?: any;
  interviewConfig?: InterviewConfig | null;
  interviewAllowed?: boolean;
  probeEnabled?: boolean;
  voiceEnabled?: boolean;
  intro?: ProblemIntroContent | null;
}) {
  const diagramRef = useDiagramCanvasRef();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session?.user?.id;

  const activeSteps = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem));

  const PHASES = Object.keys(activeSteps).map(key => {
    const steps = activeSteps[key];
    return steps.length > 0 ? steps[0].phase : key;
  });

  const [phase, setPhase] = useState<string>(PHASES[0] || 'Requirements');
  const [currentSubStep, setCurrentSubStep] = useState<string>('');
  const [currentStepKey, setCurrentStepKey] = useState<string>('');
  const [diagramCollapsed, setDiagramCollapsed] = useState(false);
  const [diagramPromptExpanded, setDiagramPromptExpanded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [savedStepData, setSavedStepData] = useState<Map<string, any>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  // Timer State
  const [serverStartedAt, setServerStartedAt] = useState<Date | string | null>((existingProgress as any)?.startedAt ?? null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>((existingProgress as any)?.isTimerRunning ?? true);
  const [serverPausedSeconds, setServerPausedSeconds] = useState<number>((existingProgress as any)?.totalPausedSeconds ?? 0);
  const [lastPausedAt, setLastPausedAt] = useState<Date | string | null>((existingProgress as any)?.lastPausedAt ?? null);
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>('running');
  // Single owner of startPracticeSession — passed to StepByStepChat so the two
  // components stop racing duplicate session creations on mount.
  const [sessionInit, setSessionInit] = useState<{ sessionId: string | null } | null>(null);
  const [practiceAloudOn, setPracticeAloudOn] = useState(false);
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  const [onIntroStep, setOnIntroStep] = useState(false);
  const [introGateReady, setIntroGateReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // First-entry: intro is step 0 — skipped for interviews and e2e suppress.
  useLayoutEffect(() => {
    if (!intro || interviewConfig) {
      setIntroGateReady(true);
      return;
    }
    setOnIntroStep(shouldAutoShowIntro(problem.slug));
    setIntroGateReady(true);
  }, [intro, interviewConfig, problem.slug]);

  const completeIntro = () => {
    try {
      localStorage.setItem(introSeenKey(problem.slug), '1');
    } catch { /* ignore */ }
    setOnIntroStep(false);
  };

  // Close desktop sidebar on outside click or Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [sidebarOpen]);
  const dispatchInterview = (event: InterviewEvent) =>
    setInterviewStatus((s) => interviewStatusReducer(s, event));

  // Reset interview session state whenever a fresh interview attempt starts
  // (guards against a stale 'complete'/'summary-error' status leaking across
  // re-entry into a new interview on the same mounted component instance).
  useEffect(() => {
    if (interviewConfig) {
      setInterviewStatus('running');
      setSummaryDismissed(false);
    }
     
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
  const phaseSteps = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem));
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
        setSessionInit({ sessionId: (result.success && result.sessionId) || null });
      } catch (error) {
        console.error("Failed to auto-start session:", error);
        // Unblock StepByStepChat's load — it degrades to not recording.
        setSessionInit({ sessionId: null });
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

  const currentStepTitle = useMemo(() => {
    if (onIntroStep && intro) return 'Problem Brief';
    if (!currentStepKey) return currentSubStep || phase || 'Practice';
    const { phaseKey, stepIndex } = parseStepKey(currentStepKey);
    return activeSteps[phaseKey]?.[stepIndex]?.title ?? currentSubStep;
  }, [onIntroStep, intro, currentStepKey, activeSteps, currentSubStep, phase]);

  const currentSectionTitle = useMemo(() => {
    if (onIntroStep && intro) return null;
    if (!currentStepKey) {
      if (!phase) return null;
      const phaseKeys = Object.keys(activeSteps);
      const phaseIndex = phaseKeys.findIndex((pk) =>
        activeSteps[pk]?.some((s) => s.phase === phase)
      );
      return phaseIndex >= 0 ? `${phaseIndex + 1}. ${phase}` : phase;
    }
    const { phaseKey } = parseStepKey(currentStepKey);
    const phaseSteps = activeSteps[phaseKey];
    if (!phaseSteps?.length) return null;
    const sectionLabel = phaseSteps[0].phase;
    const phaseIndex = Object.keys(activeSteps).indexOf(phaseKey);
    return phaseIndex >= 0 ? `${phaseIndex + 1}. ${sectionLabel}` : sectionLabel;
  }, [onIntroStep, intro, currentStepKey, activeSteps, phase]);

  const currentStepPrompt = useMemo(() => {
    if (!currentStepKey) return '';
    const { phaseKey, stepIndex } = parseStepKey(currentStepKey);
    return activeSteps[phaseKey]?.[stepIndex]?.prompt ?? '';
  }, [currentStepKey, activeSteps]);

  const currentGlobalIndex = useMemo(() => {
    if (!currentStepKey) return -1;
    const { phaseKey, stepIndex } = parseStepKey(currentStepKey);
    let idx = 0;
    for (const [pk, steps] of Object.entries(activeSteps)) {
      if (pk === phaseKey) return idx + stepIndex;
      idx += steps.length;
    }
    return idx;
  }, [currentStepKey, activeSteps]);

  const isStepRevealed = (phaseKey: string, stepIndex: number) => {
    if (onIntroStep) return false;
    let idx = 0;
    for (const [pk, steps] of Object.entries(activeSteps)) {
      if (pk === phaseKey) return idx + stepIndex <= currentGlobalIndex;
      idx += steps.length;
    }
    return false;
  };

  const isFullyComplete = completedSteps.length >= totalSteps && totalSteps > 0;

  const hasIntroStep = !!intro && !interviewConfig;
  const progressTotal = hasIntroStep ? totalSteps + 1 : totalSteps;
  const progressCurrent = hasIntroStep
    ? (onIntroStep ? 1 : currentGlobalIndex + 2)
    : Math.max(1, currentGlobalIndex + 1);

  const canHeaderBack = onIntroStep ? false : currentGlobalIndex > 0;
  const canHeaderForward = onIntroStep
    ? !!intro
    : currentGlobalIndex >= 0 && currentGlobalIndex < totalSteps - 1;

  const handleHeaderNav = (direction: 'prev' | 'next') => {
    if (onIntroStep) {
      if (direction === 'next') completeIntro();
      return;
    }
    window.dispatchEvent(
      new CustomEvent('sd-practice-nav', { detail: { direction } })
    );
  };

  // Arrow keys on the intro brief page (StepByStepChat is mounted but paused)
  useEffect(() => {
    if (!onIntroStep) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      if (e.key === 'ArrowRight' && canHeaderForward) {
        completeIntro();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onIntroStep, canHeaderForward]);

  const practiceTimerSeconds =
    stepMode === 'lite' ? 2700 :
    problem.difficulty === 'Easy' ? 1800 :
      problem.difficulty === 'Medium' ? 2700 :
        3600;

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

  const splitDiagramLayout = Boolean(currentStepKey && !onIntroStep && isDiagramRelevant);

  useEffect(() => {
    if (isDiagramRelevant) {
      setDiagramCollapsed(false);
      setDiagramPromptExpanded(false);
    }
  }, [currentStepKey, isDiagramRelevant]);

  const renderStepContent = () => (
    <>
      {(interviewConfig && interviewVariantUsesVoice(interviewConfig.variant)) ||
      (!interviewConfig && practiceAloudOn && voiceEnabled) ? (
        <VoicePanel
          slug={problem.slug}
          problemTitle={problem.title}
          practiceSessionId={existingProgress?.activeSessionId ?? null}
        />
      ) : null}

      {!introGateReady ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          {onIntroStep && intro && (
            <ProblemIntroStep problem={problem} intro={intro} onBegin={completeIntro} />
          )}
          <div
            data-tour="chat"
            className={cn('animate-fade-in', onIntroStep && 'hidden')}
            style={{ animationDelay: '100ms' }}
          >
            <StepByStepChat
              problem={problem}
              probeEnabled={probeEnabled}
              sessionInit={sessionInit}
              keyboardNavPaused={onIntroStep}
              diagramBeside={splitDiagramLayout}
            />
          </div>
        </>
      )}
    </>
  );

  const renderDiagramPanel = () => (
    <div data-tour="canvas" className="flex flex-col flex-1 min-h-0 h-full w-full animate-fade-in">
      <ErrorBoundary
        label="diagram canvas"
        detail="Your chat progress is unaffected, and previously saved diagrams are safe."
      >
        <DiagramCanvas
          stepKey={currentStepKey}
          isVisible={isDiagramRelevant && !diagramCollapsed}
        />
      </ErrorBoundary>
    </div>
  );

  // Reusable Sidebar Content
  const renderSidebar = () => (
    <div className="flex flex-col h-full min-h-0 bg-card/95 backdrop-blur-xl">
      <div className="p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient} shadow-md text-white shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base truncate leading-tight">{problem.title}</h1>
            <p className="text-xs text-muted-foreground truncate">System Design Practice</p>
            {stepMode === 'lite' && (
              <Badge variant="outline" className="mt-1.5 text-[10px] border-sky-500/30 text-sky-600 bg-sky-500/10">
                <Sparkles className="h-3 w-3 mr-1" />
                Interview Lite · 45 min
              </Badge>
            )}
            {interviewConfig && (
              <Badge variant="outline" className="mt-1.5 text-[10px] border-red-500/30 text-red-600 bg-red-500/10">
                Interview · {interviewConfig.durationSeconds / 60} min
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div data-tour="steps" className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {onIntroStep && intro && (
          <div className="px-2 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
            Problem Brief
          </div>
        )}

        {!onIntroStep && (
          <div className="space-y-1">
            {Object.entries(activeSteps).map(([phaseKey, steps], idx) => {
              const visibleSteps = steps
                .map((step, stepIndex) => ({ step, stepIndex }))
                .filter(({ stepIndex }) => isStepRevealed(phaseKey, stepIndex));
              if (visibleSteps.length === 0) return null;

              const phaseTitle = steps.length > 0 ? steps[0].phase : phaseKey;
              const isPhaseActive = phaseTitle === phase;

              return (
                <div key={phaseKey} className="mb-3">
                  <div className="px-2 mb-1.5 flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isPhaseActive ? 'text-primary' : 'text-muted-foreground opacity-70'}`}>
                      {idx + 1}. {phaseTitle}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {visibleSteps.map(({ step, stepIndex }) => {
                      const stepKey = `${phaseKey}-${stepIndex}`;
                      const data = savedStepData.get(stepKey);
                      const isCompleted = data?.completed;
                      const isFailed = data?.feedback && !data.feedback.isAcceptable;
                      const isCurrent = stepKey === currentStepKey;

                      return (
                        <button
                          key={stepIndex}
                          onClick={() => {
                            setSidebarOpen(false);
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
        )}
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

        {!interviewConfig && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('sd-start-tour'))}
            className="w-full justify-start hover:bg-muted text-muted-foreground"
          >
            <Compass className="h-3.5 w-3.5 mr-2" />
            Take the tour
          </Button>
        )}

        {intro && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSidebarOpen(false);
              setOnIntroStep(true);
            }}
            className="w-full justify-start hover:bg-muted text-muted-foreground"
          >
            <BookOpen className="h-3.5 w-3.5 mr-2" />
            Problem brief
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden relative">

      {/* Practice top bar */}
      <header className="shrink-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 md:px-4 h-12">
          <Button variant="ghost" size="sm" className="shrink-0 -ml-1 gap-1" asChild>
            <Link href="/problems">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Back</span>
            </Link>
          </Button>

          {intro && !interviewConfig && !onIntroStep && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-8 gap-1 text-xs border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setOnIntroStep(true)}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Brief</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!canHeaderBack}
            onClick={() => handleHeaderNav('prev')}
            aria-label="Previous step"
            title="Previous step (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0 text-center px-1 min-h-[2.75rem] flex flex-col items-center justify-center">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground truncate leading-tight max-w-full">
              {problem.title}
            </p>
            {currentSectionTitle && (
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-primary truncate leading-tight max-w-full">
                {currentSectionTitle}
              </p>
            )}
            <h2 className="font-semibold text-sm md:text-base truncate leading-tight max-w-full">
              {currentStepTitle}
            </h2>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {interviewConfig && interviewStatus === 'running' ? (
              <TimerWidget
                minimal
                mode="countdown"
                problemId={`interview-${interviewConfig.variant}-${problem.id}`}
                initialTimeSeconds={interviewConfig.durationSeconds}
                onComplete={() => {
                  toast.warning("Time's up! Your interview has ended.");
                  dispatchInterview('TIME_EXPIRED');
                }}
              />
            ) : !interviewConfig ? (
              <TimerWidget
                minimal
                mode="countup"
                problemId={problem.id}
                initialTimeSeconds={practiceTimerSeconds}
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
              />
            ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!canHeaderForward}
            onClick={() => handleHeaderNav('next')}
            aria-label={onIntroStep ? 'Start practice' : 'Next step'}
            title={onIntroStep ? 'Start practice (→)' : 'Next step (→)'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="w-8 shrink-0 md:hidden">
            {isMounted ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r border-border">
                  {renderSidebar()}
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
          </div>
        </div>

        {progressTotal > 0 && (
          <div className="px-4 pb-2">
            <PracticeProgress current={progressCurrent} total={progressTotal} />
          </div>
        )}
      </header>

      <div className="flex flex-1 min-h-0 relative">
        {/* Desktop: menu tab — opens sidebar on click */}
        <div ref={sidebarRef} className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            className="flex flex-col items-center gap-1 rounded-r-xl border border-border bg-card py-3 px-1.5 shadow-md cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <PanelLeftOpen className="h-4 w-4 text-primary" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground [writing-mode:vertical-lr] rotate-180">
              Menu
            </span>
          </button>
          <aside
            className={cn(
              'absolute left-full top-1/2 -translate-y-1/2 w-72 h-[85vh] ml-1 flex flex-col border border-border rounded-r-xl shadow-xl overflow-hidden bg-card transition-all duration-300 ease-out',
              sidebarOpen
                ? 'opacity-100 pointer-events-auto translate-x-0'
                : 'opacity-0 pointer-events-none -translate-x-2'
            )}
          >
            {renderSidebar()}
          </aside>
        </div>

        {/* Main Content Area — stable tree so StepByStepChat never remounts on diagram layout toggle */}
        <main
          className={cn(
            'flex-1 min-h-0',
            splitDiagramLayout
              ? 'flex flex-col overflow-hidden bg-background'
              : 'overflow-y-auto bg-gradient-to-b from-background to-muted/10'
          )}
        >
          <div
            className={cn(
              'shrink-0 flex items-center gap-3 border-b border-border/60 bg-card/90 px-4 py-2.5',
              !(splitDiagramLayout && !diagramPromptExpanded) && 'hidden'
            )}
          >
            <p className="flex-1 min-w-0 text-sm md:text-base font-semibold text-foreground truncate leading-snug">
              {currentStepPrompt}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => setDiagramPromptExpanded(true)}
            >
              Answer &amp; submit
            </Button>
          </div>

          <div
            className={cn(
              splitDiagramLayout
                ? cn(
                    'shrink-0 border-b border-border/60 bg-card/95',
                    diagramPromptExpanded ? '' : 'hidden'
                  )
                : 'max-w-3xl mx-auto w-full p-4 md:p-6 pb-20 md:px-8 md:py-6'
            )}
          >
            {splitDiagramLayout && diagramPromptExpanded && (
              <div className="flex justify-end px-3 pt-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setDiagramPromptExpanded(false)}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5 rotate-90" />
                  Minimize
                </Button>
              </div>
            )}
            <div className={splitDiagramLayout ? 'px-3 pb-2' : undefined}>
              {renderStepContent()}
            </div>
          </div>

          <div
            className={cn(
              'min-h-0 w-full',
              splitDiagramLayout ? 'flex flex-1 flex-col' : 'hidden'
            )}
          >
            {renderDiagramPanel()}
          </div>
        </main>
      </div>

      {/* First-run tour — not during timed interviews or intro step */}
      {!interviewConfig && !onIntroStep && <PracticeTour />}

      {/* Help Assistant — unchanged position */}
      {!interviewConfig && (
        <HelpAssistant
          problem={problem}
          currentPhase={phase}
          completedSteps={completedSteps}
          savedStepData={savedStepData}
        />
      )}


      {interviewConfig && interviewStatus !== 'running' && !summaryDismissed && (
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
          onClose={() => setSummaryDismissed(true)}
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
