'use client';
/* eslint-disable react-hooks/refs */

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
import { fetchWithRetry, getFetchErrorMessage } from '@/lib/fetchUtils';
import { findResumePosition } from '@/lib/step-resume';
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
import FeedbackModal from './FeedbackModal';
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
  RotateCcw,
  Info,
  Pencil,
  Check
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
  resolveEffectivePhase,
  resolvePhaseSteps,
} from '@/lib/step-journey';
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

interface SavedStepData {
  listItems: string[];
  textInput: string;
  schemaData: any[];
  feedback: FeedbackResult | null;
  completed: boolean;
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
): { savedStepData: Map<string, SavedStepData>; completedSteps: Set<string> } {
  const latestByStep = new Map<string, DbSubmission>();
  for (const sub of submissions) {
    latestByStep.set(sub.stepId, sub);
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

  return { savedStepData, completedSteps };
}

// findResumePosition lives in @/lib/step-resume so it can be unit-tested
// without dragging this component's server-action imports into the test.

export default function StepByStepChat({ problem, probeEnabled = false, sessionInit = null }: Props) {
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
  const [showFirstStepHint, setShowFirstStepHint] = useState(false);

  useEffect(() => {
    try {
      setShowFirstStepHint(localStorage.getItem('sd_first_step_hint_dismissed') !== '1');
    } catch { /* private mode — keep hidden */ }
  }, []);

  const dismissFirstStepHint = () => {
    setShowFirstStepHint(false);
    try {
      localStorage.setItem('sd_first_step_hint_dismissed', '1');
    } catch { /* ignore */ }
  };

  // Store all step data
  const [savedStepData, setSavedStepData] = useState<Map<string, SavedStepData>>(new Map());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

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

  const currentSubStep = currentStep?.subStep;

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
  }, [problem.slug, problem.steps, currentPhase, currentStepIndex]);

  const { data: session, status: sessionStatus } = useSession();
  const sessionLoadedForRef = useRef<string | null>(null);

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
    if (sessionLoadedForRef.current === loadKey) return;

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
            const { savedStepData: dbSaved, completedSteps: dbCompleted } = reconstructFromSubmissions(
              activeResult.submissions,
              activeResult.completedStepIds ?? [],
              PHASE_STEPS
            );
            const resume = findResumePosition(PHASE_STEPS, dbCompleted);

            setCurrentPhase(resume.phase);
            setCurrentStepIndex(resume.stepIndex);
            setSavedStepData(dbSaved);
            setCompletedSteps(dbCompleted);
            setSessionRestored(true);
            setRestoredDate(
              activeResult.session?.startedAt
                ? new Date(activeResult.session.startedAt)
                : new Date()
            );
            if (isMounted) {
              sessionLoadedForRef.current = loadKey;
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
            sessionLoadedForRef.current = loadKey;
          }
        } catch (error) {
          console.error('Failed to load session from account:', error);
          if (isMounted) {
            setSessionRestored(true);
            sessionLoadedForRef.current = loadKey;
          }
        }
        return;
      }

      const restored = loadSessionState(problem.slug);
      if (isMounted) {
        if (restored) {
          setCurrentPhase(restored.currentPhase);
          setCurrentStepIndex(restored.currentStepIndex);
          setSavedStepData(restored.savedStepData as Map<string, SavedStepData>);
          setCompletedSteps(restored.completedSteps as Set<string>);
          setSessionRestored(true);
          setRestoredDate(restored.lastUpdated);
        } else {
          setSessionRestored(true);
        }
        sessionLoadedForRef.current = loadKey;
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
  }, [phases]);


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

    sessionLoadedForRef.current = null;

    toast.success('Session cleared! Starting fresh.');
  }, [problem.id, problem.slug, session?.user]);

  // Load saved form data when navigating between steps. Feedback modal opens only
  // from handleSubmit — never re-open from saved state (that caused modal flicker/loops).
  useEffect(() => {
    const saved = savedStepData.get(currentStepKey);
    if (saved) {
      setListItems(saved.listItems);
      setTextInput(saved.textInput);
      setSchemaData(saved.schemaData || []);
      setFeedback(saved.feedback);
    } else {
      setListItems([]);
      setTextInput('');
      setSchemaData([]);
      setFeedback(null);
    }
    setShowFeedback(false);
    setProbeContext(null);
    setNewItemInput('');
  }, [currentStepKey]);

  // Dispatch phase change events
  useEffect(() => {
    const evt = new CustomEvent('sd-phase-change', {
      detail: { phase: currentStep.phase, subStep: currentStep.subStep, stepKey: currentStepKey }
    });
    window.dispatchEvent(evt);
  }, [currentStep.phase, currentStep.subStep, currentStepKey]);

  // Dispatch progress updates
  useEffect(() => {
    const evt = new CustomEvent('sd-progress-update', {
      detail: {
        phase: currentStep.phase,
        completedSteps: Array.from(completedSteps),
        savedStepData: savedStepData
      }
    });
    window.dispatchEvent(evt);
  }, [currentStep.phase, completedSteps, savedStepData]);

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

    // Check if diagram should be included (for High Level Architecture and Data Flow steps)
    const shouldIncludeDiagram = isDiagramSubStep(currentStep.subStep);

    setLoading(true);
    setShowFeedback(false);
    setEvaluationError(null);

    try {
      const requestBody: any = {
        problem: problem.slug,
        phase: currentStep.phase,
        phaseKey: effectivePhase,
        subStep: currentStep.subStep,
        userAnswer,
        problemDetails: problem
      };

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

      const res = await fetchWithRetry('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        retries: 2,
        timeout: 15000,
      });

      const data = await res.json();
      setFeedback(data.feedback);
      setShowFeedback(true);

      const newSavedData = new Map(savedStepData);
      newSavedData.set(currentStepKey, {
        listItems: [...listItems],
        textInput,
        schemaData: [...schemaData],
        feedback: data.feedback,
        completed: data.feedback.isAcceptable,
        diagramData: usedDiagramData ?? savedStepData.get(currentStepKey)?.diagramData ?? null,
      });
      setSavedStepData(newSavedData);

      const wasAlreadyCompleted = completedSteps.has(currentStepKey);

      (async () => {
        if (data.feedback.isAcceptable && !wasAlreadyCompleted) {
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
        } else if (data.feedback.isAcceptable && wasAlreadyCompleted) {
          toast.info('Step Updated (Already Completed)', {
            icon: '✓',
            className: 'bg-muted border-border text-muted-foreground'
          });
        }

        if (activeSessionId && userAnswer.trim()) {
          try {
            await recordStepSubmission({
              sessionId: activeSessionId,
              problemId: problem.id,
              stepId: currentStepKey,
              phase: effectivePhase,
              content: userAnswer,
              feedback: JSON.stringify(data.feedback),
              score: Math.round(data.feedback.score),
              isPassing: data.feedback.isAcceptable,
              problemSlug: problem.slug,
            });
          } catch (error) {
            console.error('Failed to record step submission:', error);
          }
        }

        if (data.feedback.isAcceptable) {
          let totalStepsCount = 0;
          Object.values(PHASE_STEPS).forEach(steps => totalStepsCount += steps.length);

          const newCompletedSize = wasAlreadyCompleted
            ? completedSteps.size
            : completedSteps.size + 1;

          if (newCompletedSize >= totalStepsCount && activeSessionId) {
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
                activeSessionId,
                Math.round(data.feedback.score),
                snapshot ?? undefined
              );
              toast.success('🎉 Problem Completed! You have finished all steps!');
            } catch (error) {
              console.error('Failed to complete session:', error);
            }
          }
        }
      })().catch(err => console.error('Background updates failed:', err));

      if (data.feedback.isAcceptable) {
        setCompletedSteps(new Set(completedSteps).add(currentStepKey));
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setEvaluationError(getFetchErrorMessage(error));
    }

    setLoading(false);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (safeStepIndex < currentSteps.length - 1) {
      setCurrentStepIndex(safeStepIndex + 1);
    } else {
      const currentPhaseIndex = phases.indexOf(effectivePhase);
      if (currentPhaseIndex < phases.length - 1) {
        setCurrentPhase(phases[currentPhaseIndex + 1]);
        setCurrentStepIndex(0);
      } else {
        setIsSessionCompleted(true);
        toast.success('🎉 Congratulations! You have completed all sections!');
      }
    }
  };

  const handlePrevious = () => {
    if (safeStepIndex > 0) {
      setCurrentStepIndex(safeStepIndex - 1);
    } else {
      const currentPhaseIndex = phases.indexOf(effectivePhase);
      if (currentPhaseIndex > 0) {
        const prevPhase = phases[currentPhaseIndex - 1];
        setCurrentPhase(prevPhase);
        setCurrentStepIndex(PHASE_STEPS[prevPhase].length - 1);
      }
    }
  };

  const handleSkip = () => {
    // Save as skipped
    const newSavedData = new Map(savedStepData);
    newSavedData.set(currentStepKey, {
      listItems: [],
      textInput: '',
      schemaData: [],
      feedback: null,
      completed: false,
      diagramData: getDiagramDataForStep(currentStepKey),
    });
    setSavedStepData(newSavedData);
    handleNext();
    toast.info('Step skipped');
  };

  const handleRetry = () => {
    setShowFeedback(false);
    // setFeedback(null); // Retain feedback for user reference
  };

  const getPhaseColor = (phase: string) => {
    const phaseKey = phase.toLowerCase().replace('-', '').replace(' ', '') as keyof typeof tokens.colors.phase;
    return tokens.colors.phase[phaseKey] || tokens.colors.info;
  };

  const progress = currentSteps.length > 0 ? ((safeStepIndex + 1) / currentSteps.length) * 100 : 0;
  const isFirstStep = isFirstJourneyStep(effectivePhase, safeStepIndex, phases);
  const canGoBack = !isFirstStep;

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
    <div className="w-full flex flex-col gap-6">
      {showRestoreBanner && (
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
                <> — continuing at step {globalStepPosition} of {totalStepCount}</>
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

      {/* Step Content */}
      <Card className="glass border-2 border-border">
        <div className="p-6 space-y-6">
          {/* Question/Prompt */}
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-lg font-semibold flex-1">{currentStep.title}</h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all shadow-sm"
                onClick={() => setIsHistoryOpen(true)}
              >
                <History className="h-4 w-4" />
                <span className="text-xs font-medium">History</span>
              </Button>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {currentStep.prompt}
            </p>
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


          {/* AI failure banner — amber, retryable, nothing recorded. Distinct from red "needs improvement" feedback. */}
          {evaluationError && !loading && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4 text-sm" data-testid="evaluation-error-banner">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-1">
                <AlertCircle className="h-4 w-4" />
                <span>We couldn&apos;t grade your answer</span>
              </div>
              <p className="text-muted-foreground mb-3">
                {evaluationError} Your answer is still here — nothing was scored or recorded.
              </p>
              <Button size="sm" variant="outline" onClick={handleSubmit} className="border-amber-500/40 hover:bg-amber-500/10">
                Try again
              </Button>
            </div>
          )}

          {/* Persistent Retry Feedback Banner */}
          {!showFeedback && feedback && !feedback.isAcceptable && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-sm">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>Areas for Improvement</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                {feedback.weaknesses?.map((w: string, i: number) => <li key={`w-${i}`}>{w}</li>)}
                {feedback.missed?.map((m: string, i: number) => <li key={`m-${i}`}>{m}</li>)}
              </ul>
            </div>
          )}

          {/* First-session guidance — shown until dismissed, only before any progress */}
          {showFirstStepHint && completedSteps.size === 0 && !showFeedback && !feedback && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm" data-testid="first-step-hint">
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">How this works:</span> answer the question above in your own words — bullet points are fine — then hit{' '}
                <span className="font-semibold text-foreground">Submit for Review</span>. The AI interviewer gives you feedback before you move to the next step. There&apos;s no penalty for a rough first draft.
              </p>
              <button
                onClick={dismissFirstStepHint}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Dismiss hint"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Input Area - Always show, but make read-only when feedback is available */}
          <div className="space-y-4">
            {currentStep.inputType === 'list' ? (
              <div className="space-y-3">
                {/* List items */}
                {listItems.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-3 rounded-lg border group transition-colors ${showFeedback
                      ? 'bg-muted/50 border-muted-foreground/20'
                      : 'bg-muted/30 border-border hover:border-primary/50'
                      }`}
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
                        className={`flex-1 text-sm ${!showFeedback ? 'cursor-text' : ''}`}
                        onClick={() => !showFeedback && startEditingListItem(index)}
                      >
                        {item}
                      </p>
                    )}
                    {!showFeedback && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {editingItemIndex === index ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={commitEditingListItem}
                            className="h-6 w-6 p-0"
                            aria-label="Save item"
                            title="Save item"
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
                            title="Edit item"
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
                          title="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new item - only show if not showing feedback */}
                {!showFeedback && (
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
                )}

                {listItems.length === 0 && !showFeedback && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Add at least one item to continue
                  </p>
                )}
              </div>
            ) : currentStep.inputType === 'schema' ? (
              <div>
                <SchemaBuilder
                  value={schemaData}
                  onChange={setSchemaData}
                  readOnly={showFeedback}
                />
                {schemaData.length === 0 && !showFeedback && (
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
                className={`min-h-[200px] resize-none ${showFeedback ? 'bg-muted/50 cursor-not-allowed' : ''
                  }`}
                readOnly={showFeedback}
              />
            )}

            {/* Action buttons - only show if not showing feedback */}
            {!showFeedback && (
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row gap-2">
                  {canGoBack && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex-1 sm:flex-none"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-muted-foreground flex-1 sm:flex-none"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip
                  </Button>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || (
                    currentStep.inputType === 'list'
                      ? listItems.length === 0
                      : currentStep.inputType === 'schema'
                        ? schemaData.length === 0
                        : !textInput.trim()
                  )}
                  className="gradient-bg w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      {isDiagramSubStep(currentStep.subStep)
                        ? 'Analyze Design'
                        : 'Submit for Review'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Feedback Modal */}
          {feedback && (
            <FeedbackModal
              isOpen={showFeedback}
              onClose={() => setShowFeedback(false)}
              onContinue={handleNext}
              onStartProbe={() => {
                const stepAnswer =
                  currentStep.inputType === 'list'
                    ? listItems.join('\n')
                    : currentStep.inputType === 'schema'
                      ? JSON.stringify(schemaData, null, 2)
                      : textInput;
                setProbeContext({ phase: currentStep.phase, stepAnswer });
                setShowFeedback(false);
              }}
              probeEntitled={probeEnabled}
              feedback={feedback}
              xpEarned={feedback.isAcceptable ? 20 : 0}
            />
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

      {probeContext && (
        <ProbePanel
          problem={problem}
          phase={probeContext.phase}
          stepAnswer={probeContext.stepAnswer}
          onClose={() => setProbeContext(null)}
        />
      )}

      {/* Progress History and Mini Indicator removed for clean Sidebar layout */}

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span>Saved to account</span>
            </>
          ) : (
            <>
              <Info className="h-3.5 w-3.5" />
              <span>Draft saved locally</span>
            </>
          )}
        </div>
        {session?.user && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowStartOverConfirm(true)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Start Over
          </Button>
        )}
      </div>

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
