'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SystemDesignProblem } from '@/types';
import { tokens } from '@/styles/tokens';
import SchemaBuilder from '@/components/SchemaBuilder';
import { fetchWithRetry, getUserFacingFetchError, HttpError, isAiAccessUserError } from '@/lib/fetchUtils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { canAdvancePastStep, findResumePosition } from '@/lib/step-resume';
import {
  saveSessionState,
  loadSessionState,
  clearSessionState
} from '@/lib/session-storage';
import {
  startPracticeSession,
  recordStepSubmission,
  awardStepXp,
  completeSession,
  abandonSession,
  getActiveSession,
} from '@/app/actions/progress';
import StepFeedbackPanel from '@/components/StepFeedbackPanel';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  SkipForward,
  Loader2,
  ArrowLeft,
  Eye,
  Pencil,
  Check,
  Lightbulb
} from 'lucide-react';
import dynamic from 'next/dynamic';
import CompletionUI from './CompletionUI';

import SubmissionHistory from './SubmissionHistory';
import { History } from 'lucide-react';
import {
  buildStepKey,
  clampStepIndex,
  getDiagramStepKeysForProblem,
  getGenericFallbackSteps,
  isDiagramSubStep,
  isFirstJourneyStep,
  computePracticeProgress,
  resolveEffectivePhase,
  resolvePhaseSteps,
} from '@/lib/step-journey';
import { getStepInteractionHint } from '@/lib/step-hints';
import { useDiagramCanvasRef } from '@/components/diagram/DiagramCanvasContext';
import {
  blobToDataUrl,
  exportSceneToPng,
  loadDiagram,
  resolveBestDiagramSnapshot,
  trimSceneForDbSnapshot,
} from '@/lib/diagram-persistence';
import { buildDiagramDescription } from '@/lib/diagram-description';
import { shouldUseLocalSessionDraft } from '@/lib/session-persistence-policy';
import type { StepDiagramData } from '@/types/diagram';
import type { AgendaMove, GateDecision, SessionState } from '@/lib/adaptive-coach/types';
import {
  activeAgendaAsk,
  parseCoachStageId,
  postCoachTurn,
  seedCoachSessionState,
} from '@/lib/adaptive-coach/client-turn';

// Widget registry is shared with public guide pages (see widgets/registry.tsx)
import { WIDGETS } from './widgets/registry';

const ProbePanel = dynamic(() => import('./ProbePanel'), { ssr: false });

interface FeedbackResult {
  score: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  missed: string[];
  isAcceptable: boolean;
}

function isStepCompletable(feedback: FeedbackResult, gate?: GateDecision | null): boolean {
  if (feedback.isAcceptable) return true;
  return gate?.action === 'teach_forward' || gate?.action === 'advance_budget';
}

function EvaluationErrorBanner({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  const isCredits = /credits/i.test(message);
  const needsKeyOrUpgrade = isCredits || /API key|Settings/i.test(message);
  const title = isCredits
    ? 'AI credits used up'
    : needsKeyOrUpgrade
      ? 'AI access needed'
      : "We couldn't grade your answer";

  if (compact) {
    return (
      <div
        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
        data-testid="evaluation-error-banner"
        role="alert"
      >
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{message}</p>
        {needsKeyOrUpgrade ? (
          <p className="mt-1.5 flex flex-wrap gap-3">
            <Link href="/settings" className="font-medium underline underline-offset-2">
              Add API key
            </Link>
            <Link href="/pricing" className="font-medium underline underline-offset-2">
              Upgrade
            </Link>
          </p>
        ) : (
          <button type="button" className="mt-1 underline" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
      data-testid="evaluation-error-banner"
      role="alert"
    >
      <div className="mb-1 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
        <AlertCircle className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <p className="mb-3 text-muted-foreground">
        {message} Your answer is still here — nothing was scored or recorded.
      </p>
      {needsKeyOrUpgrade ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild className="bg-amber-600 text-white hover:bg-amber-700">
            <Link href="/settings">Add API key in Settings</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="border-amber-500/40 hover:bg-amber-500/10"
          >
            <Link href="/pricing">Upgrade plan</Link>
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="border-amber-500/40 hover:bg-amber-500/10"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

function submissionOutcome(
  feedback: FeedbackResult,
  gate?: GateDecision | null,
): 'earned' | 'coached' | undefined {
  if (feedback.isAcceptable) return 'earned';
  if (gate?.action === 'teach_forward' || gate?.action === 'advance_budget') return 'coached';
  return undefined;
}

interface SavedStepData {
  listItems: string[];
  textInput: string;
  schemaData: any[];
  feedback: FeedbackResult | null;
  completed: boolean;
  /** Explicit Skip — allows forward nav without a passing score. */
  skipped?: boolean;
  /** Last evaluate gate — needed to restore Continue after coached advance. */
  gate?: GateDecision | null;
  tip?: string | null;
  diagramData?: StepDiagramData | null;
}

interface Props {
  problem: SystemDesignProblem;
  probeEnabled?: boolean;
  /**
   * Session handle from PracticeUI — the single owner of startPracticeSession.
   * null = still starting (wait before loading authed state);
   * { sessionId: null } = start failed (proceed without recording).
   */
  sessionInit?: { sessionId: string | null } | null;
  /** When true, arrow-key navigation is disabled (e.g. intro brief is showing). */
  keyboardNavPaused?: boolean;
  /** Canvas is shown beside this panel (split layout) — use compact chrome. */
  diagramBeside?: boolean;
  /** When true, restore-banner step counts include the intro brief as step 1. */
  progressIncludesIntro?: boolean;
  /**
   * When true, practice uses live `/api/ai/coach/turn` agenda (plan-agenda on
   * start / pass / retry) instead of static prompts + `/api/ai/evaluate` only.
   */
  adaptiveCoachEnabled?: boolean;
}

type DbSubmission = {
  stepId: string;
  content: string;
  feedback: string | null;
  score: number | null;
  isPassing: boolean;
  createdAt: Date | string;
};

function parseStepIndex(stepId: string): number {
  const lastDash = stepId.lastIndexOf('-');
  return lastDash === -1 ? 0 : parseInt(stepId.slice(lastDash + 1), 10);
}

function reconstructFromSubmissions(
  submissions: DbSubmission[],
  completedStepIds: string[],
  phaseSteps: Record<string, { inputType?: string }[]>
): {
  savedStepData: Map<string, SavedStepData>;
  completedSteps: Set<string>;
  attemptsByStep: Record<string, number>;
} {
  const latestByStep = new Map<string, DbSubmission>();
  const attemptsByStep: Record<string, number> = {};
  for (const sub of submissions) {
    latestByStep.set(sub.stepId, sub);
    if (!sub.isPassing) {
      attemptsByStep[sub.stepId] = (attemptsByStep[sub.stepId] ?? 0) + 1;
    }
  }

  const savedStepData = new Map<string, SavedStepData>();
  const completedSteps = new Set<string>(completedStepIds);

  for (const [stepId, sub] of latestByStep) {
    const lastDash = stepId.lastIndexOf('-');
    const phaseKey = lastDash === -1 ? stepId : stepId.slice(0, lastDash);
    const stepIndex = parseStepIndex(stepId);
    const step = phaseSteps[phaseKey]?.[stepIndex];

    let listItems: string[] = [];
    let textInput = '';
    let schemaData: unknown[] = [];

    if (step?.inputType === 'list') {
      listItems = sub.content.split('\n').filter(Boolean);
    } else if (step?.inputType === 'schema') {
      try {
        schemaData = JSON.parse(sub.content) as unknown[];
      } catch {
        schemaData = [];
      }
    } else {
      textInput = sub.content;
    }

    let parsedFeedback: FeedbackResult | null = null;
    if (sub.feedback) {
      try {
        parsedFeedback = JSON.parse(sub.feedback) as FeedbackResult;
      } catch {
        parsedFeedback = null;
      }
    }

    savedStepData.set(stepId, {
      listItems,
      textInput,
      schemaData,
      feedback: parsedFeedback,
      completed: sub.isPassing,
    });

    if (sub.isPassing) {
      completedSteps.add(stepId);
    }
  }

  return { savedStepData, completedSteps, attemptsByStep };
}

// findResumePosition lives in @/lib/step-resume so it can be unit-tested
// without dragging this component's server-action imports into the test.

/** Survives StepByStepChat remounts so we don't reload DB/local position mid-navigation. */
const sessionLoadedKeys = new Set<string>();

/** Survives remounts — once the user navigates, never overwrite with resume position. */
const userHasNavigatedKeys = new Set<string>();

function navigationKey(problemId: string, userId?: string | null) {
  return `${problemId}:${userId ?? 'guest'}`;
}

function markUserNavigated(problemId: string, userId?: string | null) {
  userHasNavigatedKeys.add(navigationKey(problemId, userId));
}

function StepHintBulb({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative group/bulb shrink-0">
      <button
        type="button"
        aria-label="Step tip"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          'text-sky-600 dark:text-sky-400 hover:bg-sky-500/10',
          open && 'bg-sky-500/10'
        )}
      >
        <Lightbulb className="h-4 w-4" />
      </button>
      <div
        role="tooltip"
        data-testid="step-interaction-hint"
        className={cn(
          'absolute right-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-md',
          'transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 group-hover/bulb:opacity-100',
          !open && 'pointer-events-none group-hover/bulb:pointer-events-auto'
        )}
      >
        {hint}
      </div>
    </div>
  );
}

export default function StepByStepChat({
  problem,
  probeEnabled = false,
  sessionInit = null,
  keyboardNavPaused = false,
  diagramBeside = false,
  progressIncludesIntro = false,
  adaptiveCoachEnabled = false,
}: Props) {
  const [currentPhase, setCurrentPhase] = useState(() => {
    const keys = Object.keys(resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem)));
    return keys[0] ?? 'requirements';
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [listItems, setListItems] = useState<string[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemValue, setEditingItemValue] = useState('');
  const [textInput, setTextInput] = useState('');
  const [schemaData, setSchemaData] = useState<any[]>([]);
  const [newItemInput, setNewItemInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  // AI/network failure — distinct from a low-scoring answer: nothing is
  // recorded and the user is told to retry, not that they failed.
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [probeContext, setProbeContext] = useState<{ phase: string; stepAnswer: string } | null>(null);

  // Store all step data
  const [savedStepData, setSavedStepData] = useState<Map<string, SavedStepData>>(new Map());
  const [attemptsByStep, setAttemptsByStep] = useState<Record<string, number>>({});
  const [evaluationGate, setEvaluationGate] = useState<GateDecision | null>(null);
  const [evaluationTip, setEvaluationTip] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [coachSession, setCoachSession] = useState<SessionState | null>(null);
  const [coachAgenda, setCoachAgenda] = useState<AgendaMove[]>([]);
  const [coachBootstrapping, setCoachBootstrapping] = useState(false);
  /** When bootstrap/start fails, fall back to classic evaluate so practice stays usable. */
  const [coachUnavailable, setCoachUnavailable] = useState(false);
  const coachBootstrapKeyRef = useRef<string | null>(null);

  // Session restoration state
  const [sessionRestored, setSessionRestored] = useState(false);
  const [restoredDate, setRestoredDate] = useState<Date | null>(null);
  const [dismissedRestoreBanner, setDismissedRestoreBanner] = useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);

  // Diagram tracking removed — read live from canvas ref + savedStepData

  const diagramRef = useDiagramCanvasRef();

  const PHASE_STEPS = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem));
  const diagramStepKeys = useMemo(
    () => getDiagramStepKeysForProblem(PHASE_STEPS),
    [PHASE_STEPS]
  );
  const phases = Object.keys(PHASE_STEPS);
  const effectivePhase = resolveEffectivePhase(currentPhase, phases);
  const currentSteps = PHASE_STEPS[effectivePhase] ?? [];
  const safeStepIndex = clampStepIndex(currentStepIndex, currentSteps.length);
  const currentStep = currentSteps[safeStepIndex];
  const currentStepKey = buildStepKey(effectivePhase, safeStepIndex);
  const useCoachLive = adaptiveCoachEnabled && !coachUnavailable;
  const agendaAsk = useCoachLive ? activeAgendaAsk(coachAgenda) : undefined;
  // Never show an agenda ask from a different stage (manual Next/sidebar can desync).
  const displayPrompt =
    (useCoachLive &&
      coachSession &&
      coachSession.stageId === currentStepKey &&
      agendaAsk?.prompt) ||
    currentStep?.prompt ||
    '';

  const currentSubStep = currentStep?.subStep;

  const applyCoachStage = useCallback(
    (stageId: string) => {
      const { phaseKey, stepIndex } = parseCoachStageId(stageId);
      if (!phases.includes(phaseKey)) return;
      const clamped = clampStepIndex(stepIndex, PHASE_STEPS[phaseKey]?.length ?? 0);
      setCurrentPhase(phaseKey);
      setCurrentStepIndex(clamped);
      return { phaseKey, stepIndex: clamped };
    },
    [phases, PHASE_STEPS],
  );

  const getDiagramDataForStep = useCallback(
    (stepKey: string): StepDiagramData | null => {
      if (stepKey === currentStepKey && currentSubStep && isDiagramSubStep(currentSubStep)) {
        const live = diagramRef.current?.getScene();
        if (live && live.elements.some((el) => !el.isDeleted)) {
          return {
            scene: live,
            description:
              diagramRef.current?.getDescription() ?? buildDiagramDescription(live.elements),
          };
        }
      }
      const fromSaved = savedStepData.get(stepKey)?.diagramData;
      if (fromSaved?.scene) return fromSaved;
      const stored = loadDiagram(stepKey);
      if (stored) {
        return {
          scene: stored.scene,
          description: buildDiagramDescription(stored.scene.elements),
          timestamp: stored.timestamp,
        };
      }
      return fromSaved ?? null;
    },
    [currentStepKey, currentSubStep, diagramRef, savedStepData]
  );

  useEffect(() => {
    const phaseKeys = Object.keys(resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem)));
    const nextPhase = resolveEffectivePhase(currentPhase, phaseKeys);
    const stepsInPhase = resolvePhaseSteps(problem.steps, getGenericFallbackSteps(problem))[nextPhase] ?? [];
    const nextIndex = clampStepIndex(currentStepIndex, stepsInPhase.length);

    if (nextPhase !== currentPhase) {
      setCurrentPhase(nextPhase);
    }
    if (nextIndex !== currentStepIndex) {
      setCurrentStepIndex(nextIndex);
    }
    // Only re-validate when the problem or phase changes — not on every step index change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.slug, problem.steps, currentPhase]);

  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (restoredDate) {
      setDismissedRestoreBanner(false);
    }
  }, [restoredDate]);

  useEffect(() => {
    if (!restoredDate || dismissedRestoreBanner) return;

    const timer = window.setTimeout(() => {
      setDismissedRestoreBanner(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [restoredDate, dismissedRestoreBanner]);

  // Load session once per problem visit. Re-running on session refresh (e.g. after
  // updateStreak in FeedbackModal) would call findResumePosition and skip ahead
  // before the user clicks "Continue to Next Step".
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    const loadKey = `${problem.id}:${session?.user?.id ?? 'guest'}`;
    // Module-level cache survives remounts; state does not. Still mark restored
    // so coach bootstrap / drafts can run after remount without re-fetching.
    if (sessionLoadedKeys.has(loadKey)) {
      setSessionRestored(true);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      if (session?.user) {
        // PracticeUI owns startPracticeSession (calling it from both components
        // raced and created duplicate sessions). Wait for its handle.
        if (!sessionInit) return;
        try {
          if (isMounted && sessionInit.sessionId) {
            setActiveSessionId(sessionInit.sessionId);
          }

          const activeResult = await getActiveSession(problem.id);
          if (
            isMounted &&
            activeResult.success &&
            activeResult.submissions &&
            activeResult.submissions.length > 0
          ) {
            const {
              savedStepData: dbSaved,
              completedSteps: dbCompleted,
              attemptsByStep: dbAttempts,
            } = reconstructFromSubmissions(
              activeResult.submissions,
              activeResult.completedStepIds ?? [],
              PHASE_STEPS
            );
            const resume = findResumePosition(PHASE_STEPS, dbCompleted);

            if (!userHasNavigatedKeys.has(loadKey)) {
              setCurrentPhase(resume.phase);
              setCurrentStepIndex(resume.stepIndex);
            }
            setSavedStepData(dbSaved);
            setCompletedSteps(dbCompleted);
            setAttemptsByStep(dbAttempts);
            setSessionRestored(true);
            setRestoredDate(
              activeResult.session?.startedAt
                ? new Date(activeResult.session.startedAt)
                : new Date()
            );
            if (isMounted) {
              sessionLoadedKeys.add(loadKey);
            }

            // Check if all steps are completed
            const allStepsCount = Object.values(PHASE_STEPS).reduce((sum, steps) => sum + (steps?.length ?? 0), 0);
            if (dbCompleted.size >= allStepsCount && allStepsCount > 0) {
              setIsSessionCompleted(true);
            }
            return;
          }

          if (isMounted) {
            setSessionRestored(true);
            sessionLoadedKeys.add(loadKey);
          }
        } catch (error) {
          console.error('Failed to load session from account:', error);
          if (isMounted) {
            setSessionRestored(true);
            sessionLoadedKeys.add(loadKey);
          }
        }
        return;
      }

      const restored = loadSessionState(problem.slug);
      if (isMounted) {
        if (restored) {
          if (!userHasNavigatedKeys.has(loadKey)) {
            setCurrentPhase(restored.currentPhase);
            setCurrentStepIndex(restored.currentStepIndex);
          }
          setSavedStepData(restored.savedStepData as Map<string, SavedStepData>);
          setCompletedSteps(restored.completedSteps as Set<string>);
          setSessionRestored(true);
          setRestoredDate(restored.lastUpdated);
        } else {
          setSessionRestored(true);
        }
        sessionLoadedKeys.add(loadKey);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [problem.id, problem.slug, problem.steps, session?.user?.id, sessionStatus, sessionInit]);

  // Save session to localStorage as draft buffer (guests only; signed-in users use DB)
  useEffect(() => {
    if (!sessionRestored) return;
    if (!shouldUseLocalSessionDraft(Boolean(session?.user))) return;

    const stateToSave = {
      currentPhase,
      currentStepIndex,
      savedStepData,
      completedSteps,
    };

    const timer = window.setTimeout(() => {
      saveSessionState(problem.slug, stateToSave);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    problem.slug,
    currentPhase,
    currentStepIndex,
    savedStepData,
    completedSteps,
    sessionRestored,
    session?.user,
  ]);

  // Listen for navigation events from Sidebar
  useEffect(() => {
    const handleNavigation = (e: any) => {
      const { phase, stepIndex } = e.detail;
      if (phase && phases.includes(phase)) {
        markUserNavigated(problem.id, session?.user?.id);
        setCurrentPhase(phase);
        if (typeof stepIndex === 'number') {
          setCurrentStepIndex(stepIndex);
        }
      }
    };

    window.addEventListener('sd-navigate-step', handleNavigation as EventListener);
    return () => {
      window.removeEventListener('sd-navigate-step', handleNavigation as EventListener);
    };
  }, [phases, problem.id, session?.user?.id]);


  // Auto-save drafts
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!loading && !showFeedback && (textInput || listItems.length > 0 || schemaData.length > 0)) {
        setSavedStepData(prev => {
          const newSavedData = new Map(prev);
          const currentSaved = newSavedData.get(currentStepKey) || {
            listItems: [], textInput: '', schemaData: [], feedback: null, completed: false, diagramData: null
          };

          // Only update if something changed
          if (
            JSON.stringify(currentSaved.listItems) === JSON.stringify(listItems) &&
            currentSaved.textInput === textInput &&
            JSON.stringify(currentSaved.schemaData) === JSON.stringify(schemaData)
          ) {
            return prev;
          }

          newSavedData.set(currentStepKey, {
            ...currentSaved,
            listItems: listItems,
            textInput: textInput,
            schemaData: schemaData,
          });
          return newSavedData;
        });
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [textInput, listItems, schemaData, currentStepKey, loading, showFeedback]);

  // Clear session handler
  const handleClearSession = useCallback(async () => {
    clearSessionState(problem.slug);

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('diagram-')) {
        localStorage.removeItem(key);
      }
    });

    if (session?.user) {
      try {
        const abandonResult = await abandonSession(problem.id);
        if (abandonResult.success && abandonResult.sessionId) {
          setActiveSessionId(abandonResult.sessionId);
        } else {
          const startResult = await startPracticeSession(problem.id);
          if (startResult.success && startResult.sessionId) {
            setActiveSessionId(startResult.sessionId);
          }
        }
      } catch (error) {
        console.error('Failed to abandon session:', error);
      }
    } else {
      setActiveSessionId(null);
    }

    setCurrentPhase('requirements');
    setCurrentStepIndex(0);
    setListItems([]);
    setTextInput('');
    setSchemaData([]);
    setFeedback(null);
    setShowFeedback(false);
    setCompletedSteps(new Set());
    setIsSessionCompleted(false);
    setSavedStepData(new Map());
    setSessionRestored(true);
    setRestoredDate(null);
    setCoachSession(null);
    setCoachAgenda([]);
    setCoachUnavailable(false);
    setCoachBootstrapping(false);
    coachBootstrapKeyRef.current = null;

    sessionLoadedKeys.delete(`${problem.id}:${session?.user?.id ?? 'guest'}`);
    userHasNavigatedKeys.delete(`${problem.id}:${session?.user?.id ?? 'guest'}`);

    toast.success('Session cleared! Starting fresh.');
  }, [problem.id, problem.slug, session?.user]);

  const reviewDismissedForStepRef = useRef<string | null>(null);

  const enterEditFromReview = () => {
    reviewDismissedForStepRef.current = currentStepKey;
    setShowFeedback(false);
  };

  // Load saved form + restore inline review when navigating between steps.
  useEffect(() => {
    reviewDismissedForStepRef.current = null;
    const saved = savedStepData.get(currentStepKey);
    if (saved) {
      setListItems(saved.listItems);
      setTextInput(saved.textInput);
      setSchemaData(saved.schemaData || []);
      setFeedback(saved.feedback);
      setEvaluationGate(saved.gate ?? null);
      setEvaluationTip(saved.tip ?? null);
      setShowFeedback(Boolean(saved.feedback) && !saved.skipped);
    } else {
      setListItems([]);
      setTextInput('');
      setSchemaData([]);
      setFeedback(null);
      setEvaluationGate(null);
      setEvaluationTip(null);
      setShowFeedback(false);
    }
    setProbeContext(null);
    setNewItemInput('');
    // Intentionally only on step change — not on every savedStepData write (autosave).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepKey]);

  // After async session restore on the same step key, open review if feedback exists.
  useEffect(() => {
    if (!sessionRestored) return;
    if (reviewDismissedForStepRef.current === currentStepKey) return;
    const saved = savedStepData.get(currentStepKey);
    if (!saved?.feedback || saved.skipped) return;
    setFeedback(saved.feedback);
    setEvaluationGate(saved.gate ?? null);
    setEvaluationTip(saved.tip ?? null);
    if (saved.listItems.length) setListItems(saved.listItems);
    if (saved.textInput) setTextInput(saved.textInput);
    if (saved.schemaData?.length) setSchemaData(saved.schemaData);
    setShowFeedback(true);
    // Only react to restore completing / step key — not ongoing autosave mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRestored, currentStepKey]);

  // Dispatch phase change events (include live agenda prompt for diagram header)
  useEffect(() => {
    if (!currentStep) return;
    const evt = new CustomEvent('sd-phase-change', {
      detail: {
        phase: currentStep.phase,
        subStep: currentStep.subStep,
        stepKey: currentStepKey,
        prompt: displayPrompt || currentStep.prompt,
      },
    });
    window.dispatchEvent(evt);
  }, [currentStep, currentStepKey, displayPrompt]);

  // Bootstrap live coach agenda once intro is done and session position is restored.
  // Only mark bootstrapKeyRef after a successful apply. React Strict Mode remounts
  // cancel the first in-flight start; setting the ref before the fetch made the
  // remount bail early so the LLM agenda never landed (static rail prompt forever).
  useEffect(() => {
    if (!useCoachLive || keyboardNavPaused || !sessionRestored || !currentStep) return;

    const bootstrapKey = `${problem.slug}:${session?.user?.id ?? 'guest'}`;
    if (coachBootstrapKeyRef.current === bootstrapKey) return;

    let cancelled = false;
    (async () => {
      setCoachBootstrapping(true);
      try {
        // Always plan-agenda on the first rail stage so the opening ask is LLM-written.
        // Mid-resume elsewhere: seed the static rail prompt until the next submit re-plans.
        const onFirstRail = isFirstJourneyStep(effectivePhase, safeStepIndex, phases);

        if (onFirstRail) {
          const res = await postCoachTurn({
            problemSlug: problem.slug,
            mode: 'practice',
            event: { type: 'start' },
            sessionState: null,
          });
          if (cancelled) return;
          setCoachSession(res.sessionState);
          setCoachAgenda(res.ui.agenda);
          applyCoachStage(res.sessionState.stageId);
        } else {
          const seedAgenda: AgendaMove[] = [
            {
              id: `seed-${currentStepKey}`,
              kind: 'ask',
              prompt: currentStep.prompt,
              skillFocus: [],
              source: 'rail',
            },
          ];
          if (cancelled) return;
          setCoachSession(
            seedCoachSessionState({
              problemSlug: problem.slug,
              stageId: currentStepKey,
              agenda: seedAgenda,
            }),
          );
          setCoachAgenda(seedAgenda);
        }
        coachBootstrapKeyRef.current = bootstrapKey;
      } catch (error) {
        // Expected AI-access states (credits / BYOK) — toast only, don't console.error(Error)
        // or Next.js surfaces a red "Console Error" overlay.
        if (!cancelled) {
          setCoachUnavailable(true);
          const message = getUserFacingFetchError(error);
          toast.error(message, { duration: 8000 });
          if (!isAiAccessUserError(error)) {
            console.error('Adaptive coach bootstrap failed:', error);
          }
        }
      } finally {
        if (!cancelled) setCoachBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Bootstrap once per problem visit after restore; navigation must not re-plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCoachLive, keyboardNavPaused, sessionRestored, problem.slug, session?.user?.id]);

  useEffect(() => {
    if (!currentStep) return;
    const evt = new CustomEvent('sd-progress-update', {
      detail: {
        phase: currentStep.phase,
        completedSteps: Array.from(completedSteps),
        savedStepData: savedStepData,
        canGoForward: canAdvancePastStep(
          currentStepKey,
          completedSteps,
          savedStepData.get(currentStepKey),
        ),
      }
    });
    window.dispatchEvent(evt);
  }, [currentStep, currentStepKey, completedSteps, savedStepData]);

  const addListItem = () => {
    if (newItemInput.trim()) {
      setListItems([...listItems, newItemInput.trim()]);
      setNewItemInput('');
    }
  };

  const removeListItem = (index: number) => {
    setListItems(listItems.filter((_, i) => i !== index));
  };

  const startEditingListItem = (index: number) => {
    setEditingItemIndex(index);
    setEditingItemValue(listItems[index]);
  };

  const commitEditingListItem = () => {
    if (editingItemIndex === null) return;
    const trimmed = editingItemValue.trim();
    if (trimmed) {
      setListItems(listItems.map((item, i) => (i === editingItemIndex ? trimmed : item)));
    }
    setEditingItemIndex(null);
    setEditingItemValue('');
  };

  const cancelEditingListItem = () => {
    setEditingItemIndex(null);
    setEditingItemValue('');
  };

  const handleSubmit = async () => {
    const userAnswer = currentStep.inputType === 'list'
      ? listItems.join('\n')
      : currentStep.inputType === 'schema'
        ? JSON.stringify(schemaData, null, 2)
        : textInput;

    if (!userAnswer.trim() || (currentStep.inputType === 'schema' && schemaData.length === 0)) return;
    if (useCoachLive && (coachBootstrapping || !coachSession)) return;

    // Check if diagram should be included (for High Level Architecture and Data Flow steps)
    const shouldIncludeDiagram = isDiagramSubStep(currentStep.subStep);

    setLoading(true);
    setShowFeedback(false);
    setEvaluationError(null);

    try {
      const attemptCount = (attemptsByStep[currentStepKey] ?? 0) + 1;
      const priorFeedback = savedStepData.get(currentStepKey)?.feedback;
      const requestBody: any = {
        problem: problem.slug,
        phase: currentStep.phase,
        phaseKey: effectivePhase,
        subStep: currentStep.subStep,
        userAnswer,
        problemDetails: problem,
        stageId: currentStepKey,
        stepId: currentStepKey,
        attemptCount,
      };

      if (
        priorFeedback &&
        !priorFeedback.isAcceptable &&
        (priorFeedback.weaknesses?.length || priorFeedback.missed?.length)
      ) {
        requestBody.previousFeedback = {
          weaknesses: priorFeedback.weaknesses ?? [],
          missed: priorFeedback.missed ?? [],
        };
      }

      if (activeSessionId) {
        requestBody.sessionId = activeSessionId;
      }

      let usedDiagramData: StepDiagramData | null = null;

      if (shouldIncludeDiagram) {
        const stepDiagram = getDiagramDataForStep(currentStepKey);
        if (stepDiagram?.scene) {
          usedDiagramData = stepDiagram;
          const description =
            stepDiagram.description ?? buildDiagramDescription(stepDiagram.scene.elements);
          requestBody.userAnswer = `${userAnswer}\n\n[Diagram included: ${description}]`;
        } else {
          requestBody.userAnswer = `${userAnswer}\n\n[Note: No diagram was created for this architecture description]`;
        }
      }

      let feedbackResult: FeedbackResult;
      let gate: GateDecision | undefined;
      let tip: string | undefined;

      if (useCoachLive && coachSession) {
        const sessionForTurn =
          coachSession.stageId === currentStepKey
            ? coachSession
            : { ...coachSession, stageId: currentStepKey };

        const coachRes = await postCoachTurn({
          problemSlug: problem.slug,
          mode: 'practice',
          event: {
            type: 'submit',
            userAnswer: requestBody.userAnswer,
            stageId: currentStepKey,
            ...(requestBody.previousFeedback
              ? { previousFeedback: requestBody.previousFeedback }
              : {}),
          },
          sessionState: sessionForTurn,
        });

        if (!coachRes.ui.feedback) {
          throw new Error('Adaptive coach returned no feedback for this submit.');
        }

        feedbackResult = coachRes.ui.feedback;
        gate = coachRes.ui.gate;
        tip = typeof coachRes.ui.tip === 'string' ? coachRes.ui.tip : undefined;
        setCoachSession(coachRes.sessionState);
        setCoachAgenda(coachRes.ui.agenda);
      } else {
        const res = await fetchWithRetry('/api/ai/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          retries: 2,
          timeout: 15000,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new HttpError(
            res.status,
            typeof data?.message === 'string'
              ? data.message
              : typeof data?.error === 'string'
                ? data.error
                : 'Evaluation failed.',
          );
        }
        feedbackResult = data.feedback;
        gate = data.gate as GateDecision | undefined;
        tip = typeof data.tip === 'string' ? data.tip : undefined;
      }

      const stepCompletable = isStepCompletable(feedbackResult, gate);

      setAttemptsByStep((prev) => ({ ...prev, [currentStepKey]: attemptCount }));
      setEvaluationGate(gate ?? null);
      setEvaluationTip(tip ?? null);
      setFeedback(feedbackResult);
      setShowFeedback(true);
      reviewDismissedForStepRef.current = null;

      if (gate?.action === 'advance_budget') {
        toast.info(gate.reason, {
          icon: <Lightbulb className="h-4 w-4" />,
          className: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
        });
      }

      const newSavedData = new Map(savedStepData);
      newSavedData.set(currentStepKey, {
        listItems: [...listItems],
        textInput,
        schemaData: [...schemaData],
        feedback: feedbackResult,
        completed: stepCompletable,
        skipped: false,
        gate: gate ?? null,
        tip: tip ?? null,
        diagramData: usedDiagramData ?? savedStepData.get(currentStepKey)?.diagramData ?? null,
      });
      setSavedStepData(newSavedData);

      const wasAlreadyCompleted = completedSteps.has(currentStepKey);

      (async () => {
        if (feedbackResult.isAcceptable && !wasAlreadyCompleted) {
          try {
            const result = await awardStepXp(problem.id, currentStepKey);
            if (result.success) {
              const xpAwarded = result.xpAwarded || 0;

              if (xpAwarded > 0) {
                toast.success(`Step Complete! +${xpAwarded} XP`, {
                  icon: '⚡',
                  className: 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                });

                if (result.levelUp) {
                  toast.success(`Level Up! You are now Level ${result.newLevel}!`, {
                    icon: '🎓',
                    className: 'bg-purple-500/10 border-purple-500/20 text-purple-600 font-bold'
                  });
                }
              }
            }
          } catch (error) {
            console.error('Failed to award XP:', error);
          }
        } else if (feedbackResult.isAcceptable && wasAlreadyCompleted) {
          toast.info('Step Updated (Already Completed)', {
            icon: '✓',
            className: 'bg-muted border-border text-muted-foreground'
          });
        }

        // A fast submit can beat PracticeUI's session handle (sessionInit) —
        // never silently drop the user's work: the server action is
        // idempotent, so resolving the session here as a fallback is safe.
        let sessionIdForRecord = activeSessionId;
        if (!sessionIdForRecord && session?.user) {
          try {
            const started = await startPracticeSession(problem.id);
            if (started.success && started.sessionId) {
              sessionIdForRecord = started.sessionId;
              setActiveSessionId(started.sessionId);
            }
          } catch (error) {
            console.error('Failed to resolve session for submission:', error);
          }
        }

        if (sessionIdForRecord && userAnswer.trim()) {
          try {
            const recorded = await recordStepSubmission({
              sessionId: sessionIdForRecord,
              problemId: problem.id,
              stepId: currentStepKey,
              phase: effectivePhase,
              content: userAnswer,
              feedback: JSON.stringify(feedbackResult),
              score: Math.round(feedbackResult.score),
              isPassing: stepCompletable,
              problemSlug: problem.slug,
              gateAction: gate?.action ?? null,
              outcome: submissionOutcome(feedbackResult, gate) ?? null,
            });
            if (!recorded.success) {
              toast.error(recorded.error ?? 'Could not save your submission');
            }
          } catch (error) {
            console.error('Failed to record step submission:', error);
            toast.error('Could not save your submission');
          }
        } else if (session?.user && userAnswer.trim() && !sessionIdForRecord) {
          toast.error('Progress session missing — sign out and sign in again to save answers');
        }

        if (stepCompletable) {
          let totalStepsCount = 0;
          Object.values(PHASE_STEPS).forEach(steps => totalStepsCount += steps.length);

          const newCompletedSize = wasAlreadyCompleted
            ? completedSteps.size
            : completedSteps.size + 1;

          if (newCompletedSize >= totalStepsCount && sessionIdForRecord) {
            try {
              let snapshot = resolveBestDiagramSnapshot(diagramStepKeys, newSavedData);
              if (snapshot?.scene && !snapshot.imageData) {
                const png = await exportSceneToPng(snapshot.scene);
                if (png) {
                  snapshot.imageData = await blobToDataUrl(png);
                }
              }
              if (snapshot?.scene) {
                snapshot = {
                  ...snapshot,
                  scene: trimSceneForDbSnapshot(snapshot.scene),
                  description:
                    snapshot.description ??
                    buildDiagramDescription(snapshot.scene.elements) ??
                    undefined,
                };
              }
              await completeSession(
                sessionIdForRecord,
                Math.round(feedbackResult.score),
                snapshot ?? undefined
              );
              toast.success('🎉 Problem Completed! You have finished all steps!');
            } catch (error) {
              console.error('Failed to complete session:', error);
            }
          }
        }
      })().catch(err => console.error('Background updates failed:', err));

      if (stepCompletable) {
        setCompletedSteps(new Set(completedSteps).add(currentStepKey));
      }
    } catch (error) {
      const message = getUserFacingFetchError(error);
      setEvaluationError(message);
      if (isAiAccessUserError(error)) {
        toast.error(message, { duration: 8000 });
      } else {
        console.error('Error evaluating answer:', error);
      }
    }

    setLoading(false);
  };

  const persistStepPosition = (phase: string, stepIndex: number) => {
    markUserNavigated(problem.id, session?.user?.id);
    if (!sessionRestored || !shouldUseLocalSessionDraft(Boolean(session?.user))) return;
    saveSessionState(problem.slug, {
      currentPhase: phase,
      currentStepIndex: stepIndex,
      savedStepData,
      completedSteps,
    });
  };

  const handleNext = () => {
    setShowFeedback(false);
    markUserNavigated(problem.id, session?.user?.id);

    const followCoachIfAhead = () => {
      if (!useCoachLive || !coachSession) return false;
      if (
        !evaluationGate ||
        !(
          evaluationGate.action === 'pass' ||
          evaluationGate.action === 'teach_forward' ||
          evaluationGate.action === 'advance_budget' ||
          evaluationGate.action === 'end_mock'
        )
      ) {
        return false;
      }

      if (coachSession.status === 'complete') {
        const finishing = coachSession;
        setIsSessionCompleted(true);
        toast.success('🎉 Congratulations! You have completed all sections!');
        void (async () => {
          try {
            const result = await postCoachTurn({
              problemSlug: problem.slug,
              mode: 'practice',
              event: { type: 'finish' },
              sessionState: finishing,
            });
            // postCoachTurn throws on error, no need to check result.error
          } catch (err) {
            console.error('Coach finish turn failed:', err);
          }
        })();
        return true;
      }

      if (coachSession.stageId !== currentStepKey) {
        const applied = applyCoachStage(coachSession.stageId);
        if (applied) {
          persistStepPosition(applied.phaseKey, applied.stepIndex);
        }
        return true;
      }

      return false;
    };

    if (followCoachIfAhead()) return;

    // Static +1 (Skip / ungated). Keep coach stageId in sync and drop stale agenda
    // so we never show an algorithm probe on Database Schema.
    const syncCoachToStep = (nextStepKey: string) => {
      if (!useCoachLive || !coachSession) return;
      if (coachSession.stageId === nextStepKey) return;
      setCoachSession({
        ...coachSession,
        stageId: nextStepKey,
        agenda: [],
        stageStartedAt: new Date().toISOString(),
      });
      setCoachAgenda([]);
    };

    if (safeStepIndex < currentSteps.length - 1) {
      const next = safeStepIndex + 1;
      setCurrentStepIndex(next);
      persistStepPosition(effectivePhase, next);
      syncCoachToStep(buildStepKey(effectivePhase, next));
    } else {
      const currentPhaseIndex = phases.indexOf(effectivePhase);
      if (currentPhaseIndex < phases.length - 1) {
        const nextPhase = phases[currentPhaseIndex + 1];
        setCurrentPhase(nextPhase);
        setCurrentStepIndex(0);
        persistStepPosition(nextPhase, 0);
        syncCoachToStep(buildStepKey(nextPhase, 0));
      } else {
        setIsSessionCompleted(true);
        toast.success('🎉 Congratulations! You have completed all sections!');
      }
    }
  };

  const handlePrevious = () => {
    markUserNavigated(problem.id, session?.user?.id);
    if (safeStepIndex > 0) {
      const next = safeStepIndex - 1;
      setCurrentStepIndex(next);
      persistStepPosition(effectivePhase, next);
    } else {
      const currentPhaseIndex = phases.indexOf(effectivePhase);
      if (currentPhaseIndex > 0) {
        const prevPhase = phases[currentPhaseIndex - 1];
        const next = PHASE_STEPS[prevPhase].length - 1;
        setCurrentPhase(prevPhase);
        setCurrentStepIndex(next);
        persistStepPosition(prevPhase, next);
      }
    }
  };

  const navigateForward = () => {
    markUserNavigated(problem.id, session?.user?.id);
    if (safeStepIndex < currentSteps.length - 1) {
      const next = safeStepIndex + 1;
      setCurrentStepIndex(next);
      persistStepPosition(effectivePhase, next);
    } else {
      const currentPhaseIndex = phases.indexOf(effectivePhase);
      if (currentPhaseIndex < phases.length - 1) {
        const nextPhase = phases[currentPhaseIndex + 1];
        setCurrentPhase(nextPhase);
        setCurrentStepIndex(0);
        persistStepPosition(nextPhase, 0);
      }
    }
  };

  const handleSkip = () => {
    // Save as skipped — explicit opt-out; does not count as a pass.
    const newSavedData = new Map(savedStepData);
    newSavedData.set(currentStepKey, {
      listItems: [],
      textInput: '',
      schemaData: [],
      feedback: null,
      completed: false,
      skipped: true,
      diagramData: getDiagramDataForStep(currentStepKey),
    });
    setSavedStepData(newSavedData);
    handleNext();
    toast.info('Step skipped');
  };

  const handleRetry = () => {
    enterEditFromReview();
  };

  const getPhaseColor = (phase: string) => {
    const phaseKey = phase.toLowerCase().replace('-', '').replace(' ', '') as keyof typeof tokens.colors.phase;
    return tokens.colors.phase[phaseKey] || tokens.colors.info;
  };

  const progress = currentSteps.length > 0 ? ((safeStepIndex + 1) / currentSteps.length) * 100 : 0;
  const isFirstStep = isFirstJourneyStep(effectivePhase, safeStepIndex, phases);
  const canGoBack = !isFirstStep;
  const hasNextStep = useMemo(() => {
    if (safeStepIndex < currentSteps.length - 1) return true;
    const currentPhaseIndex = phases.indexOf(effectivePhase);
    return currentPhaseIndex < phases.length - 1;
  }, [safeStepIndex, currentSteps.length, phases, effectivePhase]);

  const stepClearedForAdvance = canAdvancePastStep(
    currentStepKey,
    completedSteps,
    savedStepData.get(currentStepKey),
  );

  // Next / → only after pass (or coached advance) or explicit Skip — not free roam.
  const canGoForward = hasNextStep && stepClearedForAdvance;

  const currentUserAnswer = !currentStep
    ? ''
    : currentStep.inputType === 'list'
      ? listItems.join('\n')
      : currentStep.inputType === 'schema'
        ? JSON.stringify(schemaData, null, 2)
        : textInput;

  // Arrow-key + header navigation when not typing in an input
  useEffect(() => {
    if (keyboardNavPaused) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (loading || showFeedback) return;

      if (e.key === 'ArrowRight' && canGoForward) {
        e.preventDefault();
        navigateForward();
      } else if (e.key === 'ArrowRight' && hasNextStep && !stepClearedForAdvance) {
        e.preventDefault();
        toast.info('Pass this step (or Skip) before moving on');
      } else if (e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        handlePrevious();
      }
    };
    const onPracticeNav = (e: Event) => {
      const direction = (e as CustomEvent).detail?.direction;
      if (loading || showFeedback) return;
      if (direction === 'prev' && canGoBack) handlePrevious();
      if (direction === 'next' && canGoForward) navigateForward();
      if (direction === 'next' && hasNextStep && !stepClearedForAdvance) {
        toast.info('Pass this step (or Skip) before moving on');
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('sd-practice-nav', onPracticeNav);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('sd-practice-nav', onPracticeNav);
    };
  }, [loading, showFeedback, canGoBack, canGoForward, hasNextStep, stepClearedForAdvance, safeStepIndex, effectivePhase, phases, PHASE_STEPS, currentSteps.length, keyboardNavPaused]);

  const totalStepCount = useMemo(
    () => phases.reduce((sum, p) => sum + (PHASE_STEPS[p]?.length ?? 0), 0),
    [phases, PHASE_STEPS]
  );

  const globalStepPosition = useMemo(() => {
    let position = 0;
    for (const p of phases) {
      if (p === effectivePhase) {
        position += safeStepIndex + 1;
        break;
      }
      position += PHASE_STEPS[p]?.length ?? 0;
    }
    return position;
  }, [phases, effectivePhase, safeStepIndex, PHASE_STEPS]);

  const displayProgress = useMemo(
    () =>
      computePracticeProgress({
        hasIntro: progressIncludesIntro,
        onIntro: false,
        practiceStepNumber: globalStepPosition,
        practiceStepCount: totalStepCount,
      }),
    [progressIncludesIntro, globalStepPosition, totalStepCount]
  );

  const [showLastFeedbackDetails, setShowLastFeedbackDetails] = useState(false);

  const showRestoreBanner = restoredDate !== null && !dismissedRestoreBanner;

  if (!currentStep) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading practice steps...
      </div>
    );
  }


  if (isSessionCompleted) {
    return (
      <CompletionUI
        problem={problem}
        onReview={() => setIsSessionCompleted(false)}
        onReset={() => setShowStartOverConfirm(true)}
      />
    );
  }

return (
    <div className={cn('w-full flex flex-col', diagramBeside ? 'gap-2' : 'gap-4')}>
      {showRestoreBanner && !diagramBeside && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-900 dark:text-green-100"
        >
          <div className="flex items-start gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
            <p>
              <span className="font-medium">Session restored</span>
              {!isNaN(restoredDate.getTime()) && <>{' '}from {format(restoredDate, 'MMM d, yyyy · h:mm a')}</>}
              {totalStepCount > 0 && (
                <> — continuing at step {displayProgress.current} of {displayProgress.total}</>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-green-700 hover:text-green-900 hover:bg-green-500/20 dark:text-green-300"
            onClick={() => setDismissedRestoreBanner(true)}
            aria-label="Dismiss restoration notice"
            title="Dismiss restoration notice"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {diagramBeside ? (
        <div className="space-y-2" data-testid="diagram-step-compact">
          {evaluationError && !loading && (
            <EvaluationErrorBanner
              message={evaluationError}
              onRetry={handleSubmit}
              compact
            />
          )}
          {!showFeedback && feedback && !feedback.isAcceptable && (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Needs revision — revise your answer and submit again.
            </p>
          )}
          {!showFeedback && (currentStep.inputType === 'list' ? (
            <Input
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addListItem();
                }
              }}
              placeholder={currentStep.placeholder}
              className="h-9 text-sm"
            />
          ) : currentStep.inputType === 'schema' ? (
            <SchemaBuilder value={schemaData} onChange={setSchemaData} readOnly={false} />
          ) : (
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={currentStep.placeholder}
              rows={2}
              className="min-h-[52px] max-h-24 resize-none text-sm"
            />
          ))}
          {!showFeedback && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip} className="h-8 text-muted-foreground">
                Skip
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={loading || coachBootstrapping || (useCoachLive && !coachSession) || (
                  currentStep.inputType === 'list'
                    ? listItems.length === 0 && !newItemInput.trim()
                    : currentStep.inputType === 'schema'
                      ? schemaData.length === 0
                      : !textInput.trim()
                )}
                className="h-8 gradient-bg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    Submit design
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}
          {showFeedback && feedback && (
            <div className="space-y-3" data-testid="step-review-split">
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your submission
                </p>
                {currentStep.inputType === 'list' ? (
                  <ul className="space-y-1.5">
                    {listItems.map((item, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : currentStep.inputType === 'schema' ? (
                  <SchemaBuilder value={schemaData} onChange={setSchemaData} readOnly />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-mono">{textInput}</pre>
                )}
              </div>
              <StepFeedbackPanel
                feedback={feedback}
                tip={evaluationTip}
                gate={evaluationGate}
                xpEarned={feedback.isAcceptable ? 20 : 0}
                probeEntitled={probeEnabled}
                onStartProbe={() => {
                  setProbeContext({ phase: currentStep.phase, stepAnswer: currentUserAnswer });
                  enterEditFromReview();
                }}
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={enterEditFromReview}
                >
                  Edit answer
                </Button>
                {isStepCompletable(feedback, evaluationGate) ? (
                  <Button size="sm" onClick={handleNext} className="h-8 gradient-bg">
                    {feedback.isAcceptable ? 'Continue' : 'Continue with tip'}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={enterEditFromReview}
                    className="h-8 gradient-bg"
                  >
                    Try Again
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 space-y-5">
          {/* Prompt */}
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                <p
                  className={cn(
                    'font-medium leading-snug',
                    showFeedback && feedback
                      ? 'text-sm text-muted-foreground'
                      : 'text-lg md:text-xl text-foreground',
                  )}
                >
                  {displayPrompt}
                </p>
                {useCoachLive && coachBootstrapping && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Personalizing this step…
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {(() => {
                  const hint = getStepInteractionHint(currentStep);
                  return hint ? <StepHintBulb hint={hint} /> : null;
                })()}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground shrink-0"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="text-xs hidden sm:inline">History</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Interactive Widget Section */}
          {currentStep.widgetId && WIDGETS[currentStep.widgetId] && (
            <div className="my-4">
              {React.createElement(WIDGETS[currentStep.widgetId])}
            </div>
          )}

          {/* Diagram Status Indicator - Show for High Level Architecture and Data Flow steps */}
          {isDiagramSubStep(currentStep.subStep) && (() => {
            const hasDiagram = !!getDiagramDataForStep(currentStepKey)?.scene?.elements?.some(
              (el) => !el.isDeleted
            );
            return hasDiagram ? (
              <p className="rounded-lg border-2 border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
                ✓ Diagram ready — included automatically when you submit.
              </p>
            ) : (
              <p className="rounded-lg border-2 border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                Draw your architecture below — it will be included automatically when you submit.
              </p>
            );
          })()}

          {/* AI failure banner — amber, actionable. Credits → Settings/Upgrade; others → retry. */}
          {evaluationError && !loading && (
            <EvaluationErrorBanner message={evaluationError} onRetry={handleSubmit} />
          )}

          {/* Persistent Retry Feedback Banner */}
          {!showFeedback && feedback && !feedback.isAcceptable && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Needs revision — revise your answer and submit again.</span>
                </div>
                <button
                  type="button"
                  className="text-xs underline text-muted-foreground shrink-0"
                  onClick={() => setShowLastFeedbackDetails((v) => !v)}
                >
                  {showLastFeedbackDetails ? 'Hide details' : 'Show last feedback'}
                </button>
              </div>
              {showLastFeedbackDetails && (
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2 ml-2">
                  {feedback.weaknesses?.map((w: string, i: number) => <li key={`w-${i}`}>{w}</li>)}
                  {feedback.missed?.map((m: string, i: number) => <li key={`m-${i}`}>{m}</li>)}
                </ul>
              )}
            </div>
          )}

          {showFeedback && feedback ? (
            <div className="space-y-3" data-testid="step-review-split">
              <div className="grid gap-0 overflow-hidden rounded-xl border border-border/70 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="border-b border-border/70 bg-muted/20 p-4 md:border-b-0 md:border-r">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Your answer
                  </p>
                  {currentStep.inputType === 'list' ? (
                    <ul className="space-y-2">
                      {listItems.map((item, index) => (
                        <li key={index} className="flex gap-2 text-sm leading-snug">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/35" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : currentStep.inputType === 'schema' ? (
                    <SchemaBuilder value={schemaData} onChange={setSchemaData} readOnly />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                      {textInput}
                    </pre>
                  )}
                </div>
                <div className="bg-card p-4">
                  <StepFeedbackPanel
                    feedback={feedback}
                    tip={evaluationTip}
                    gate={evaluationGate}
                    xpEarned={feedback.isAcceptable ? 20 : 0}
                    probeEntitled={probeEnabled}
                    onStartProbe={() => {
                      setProbeContext({ phase: currentStep.phase, stepAnswer: currentUserAnswer });
                      enterEditFromReview();
                    }}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 -mx-5 md:-mx-6 px-5 md:px-6 py-3 bg-gradient-to-t from-card via-card to-card/80 border-t border-border/60 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <Button
                  variant="outline"
                  onClick={enterEditFromReview}
                  className="flex-1 sm:flex-none"
                >
                  Edit answer
                </Button>
                {isStepCompletable(feedback, evaluationGate) ? (
                  <Button
                    onClick={handleNext}
                    className="gradient-bg w-full sm:w-auto sm:min-w-[160px] h-11"
                  >
                    {feedback.isAcceptable ? 'Continue to Next Step' : 'Continue with coach tip'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={enterEditFromReview}
                    className="gradient-bg w-full sm:w-auto sm:min-w-[160px] h-11"
                  >
                    Try Again
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {currentStep.inputType === 'list' ? (
              <div className="space-y-3">
                {listItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg border group transition-colors bg-muted/30 border-border hover:border-primary/50"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    {editingItemIndex === index ? (
                      <Input
                        autoFocus
                        value={editingItemValue}
                        onChange={(e) => setEditingItemValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            commitEditingListItem();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditingListItem();
                          }
                        }}
                        onBlur={commitEditingListItem}
                        className="flex-1 h-7 text-sm"
                      />
                    ) : (
                      <p
                        className="flex-1 text-sm cursor-text"
                        onClick={() => startEditingListItem(index)}
                      >
                        {item}
                      </p>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {editingItemIndex === index ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={commitEditingListItem}
                          className="h-6 w-6 p-0"
                          aria-label="Save item"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingListItem(index)}
                          className="h-6 w-6 p-0"
                          aria-label="Edit item"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeListItem(index)}
                        className="h-6 w-6 p-0"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addListItem();
                      }
                    }}
                    placeholder={currentStep.placeholder}
                    className="flex-1"
                  />
                  <Button
                    onClick={addListItem}
                    disabled={!newItemInput.trim()}
                    variant="outline"
                    className="shrink-0 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {listItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                    Type an idea above and press <strong>Add</strong> — even one entry is enough to submit.
                  </p>
                )}
              </div>
            ) : currentStep.inputType === 'schema' ? (
              <div>
                <SchemaBuilder
                  value={schemaData}
                  onChange={setSchemaData}
                  readOnly={false}
                />
                {schemaData.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 mt-4">
                    Add at least one entity with fields to continue
                  </p>
                )}
              </div>
            ) : (
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={currentStep.placeholder}
                className="resize-none min-h-[200px]"
              />
            )}

            <div className="sticky bottom-0 -mx-5 md:-mx-6 px-5 md:px-6 py-4 bg-gradient-to-t from-card via-card to-card/80 border-t border-border/60 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex gap-2">
                {canGoBack && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Back
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground flex-1 sm:flex-none"
                >
                  <SkipForward className="h-4 w-4 mr-1.5" />
                  Skip
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || coachBootstrapping || (useCoachLive && !coachSession) || (
                  currentStep.inputType === 'list'
                    ? listItems.length === 0
                    : currentStep.inputType === 'schema'
                      ? schemaData.length === 0
                      : !textInput.trim()
                )}
                className="gradient-bg w-full sm:w-auto sm:min-w-[160px] h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    {isDiagramSubStep(currentStep.subStep) ? 'Submit design' : 'Submit answer'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
          )}

          <SubmissionHistory
            isOpen={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            problemId={problem.id}
            stepId={currentStepKey}
            stepTitle={currentStep.title}
          />
        </div>
      </Card>
      )}

      {probeContext && (
        <ProbePanel
          problem={problem}
          phase={probeContext.phase}
          stepAnswer={probeContext.stepAnswer}
          onClose={() => setProbeContext(null)}
        />
      )}

      {/* Progress History and Mini Indicator removed for clean Sidebar layout */}

      <Dialog open={showStartOverConfirm} onOpenChange={setShowStartOverConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Start over?</DialogTitle>
            <DialogDescription>
              This will clear your current answers, feedback, and diagram drafts for this
              problem. Your previous session will be saved in history, but you will begin a
              new attempt from step one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartOverConfirm(false)}>
              Keep practicing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowStartOverConfirm(false);
                void handleClearSession();
              }}
            >
              Start over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
