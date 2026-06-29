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
import { fetchWithRetry } from '@/lib/fetchUtils';
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
  Info
} from 'lucide-react';
import dynamic from 'next/dynamic';
import WidgetLoader from './widgets/WidgetLoader';

import SubmissionHistory from './SubmissionHistory';
import { History } from 'lucide-react';
import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import {
  buildStepKey,
  clampStepIndex,
  isDiagramSubStep,
  isFirstJourneyStep,
  resolveEffectivePhase,
  resolvePhaseSteps,
} from '@/lib/step-journey';

// Dynamic imports for widgets to improve initial load performance
const WIDGETS: Record<string, React.ComponentType> = {
  'encoding-visualizer': dynamic(() => import('./widgets/EncodingVisualizer'), { loading: () => <WidgetLoader /> }),
  'capacity-calculator': dynamic(() => import('./widgets/CapacityCalculator'), { loading: () => <WidgetLoader /> }),
  'fanout-visualizer': dynamic(() => import('./widgets/FanoutVisualizer'), { loading: () => <WidgetLoader /> }),
  'feed-ranking-simulator': dynamic(() => import('./widgets/FeedRankingSimulator'), { loading: () => <WidgetLoader /> }),
  'quadtree-visualizer': dynamic(() => import('./widgets/QuadTreeVisualizer'), { loading: () => <WidgetLoader /> }),
  'abr-simulator': dynamic(() => import('./widgets/ABRSimulator'), { loading: () => <WidgetLoader /> }),
  'e2e-encryption-demo': dynamic(() => import('./widgets/E2EEncryptionDemo'), { loading: () => <WidgetLoader /> }),
  'feed-architect': dynamic(() => import('./widgets/FeedArchitect'), { loading: () => <WidgetLoader /> }),
  'inverted-index-visualizer': dynamic(() => import('./widgets/InvertedIndexVisualizer'), { loading: () => <WidgetLoader /> }),
  'chunking-dedupe-demo': dynamic(() => import('./widgets/ChunkingDedupeDemo'), { loading: () => <WidgetLoader /> }),
  'rate-limiter-demo': dynamic(() => import('./widgets/RateLimiterDemo'), { loading: () => <WidgetLoader /> }),
  'cache-visualizer': dynamic(() => import('./widgets/CacheVisualizer'), { loading: () => <WidgetLoader /> }),
  'trie-visualizer': dynamic(() => import('./widgets/TrieVisualizer'), { loading: () => <WidgetLoader /> }),
  'snowflake-demo': dynamic(() => import('./widgets/SnowflakeDemo'), { loading: () => <WidgetLoader /> }),
  'leaderboard-simulation': dynamic(() => import('./widgets/LeaderboardSimulation'), { loading: () => <WidgetLoader /> }),
  'notification-system-demo': dynamic(() => import('./widgets/NotificationSystemDemo'), { loading: () => <WidgetLoader /> }),
  'metrics-dashboard': dynamic(() => import('./widgets/MetricsDashboard'), { loading: () => <WidgetLoader /> }),
  'consistent-hashing-demo': dynamic(() => import('./widgets/ConsistentHashingDemo'), { loading: () => <WidgetLoader /> }),
  'load-balancer-visualizer': dynamic(() => import('./widgets/LoadBalancerVisualizer'), { loading: () => <WidgetLoader /> }),
  'message-queue-visualizer': dynamic(() => import('./widgets/MessageQueueVisualizer'), { loading: () => <WidgetLoader /> }),
  'cdn-map': dynamic(() => import('./widgets/CDNMap'), { loading: () => <WidgetLoader /> }),
  'crawler-frontier': dynamic(() => import('./widgets/CrawlerFrontier'), { loading: () => <WidgetLoader /> }),
  'dfs-visualizer': dynamic(() => import('./widgets/DFSVisualizer'), { loading: () => <WidgetLoader /> }),
  'leader-election-demo': dynamic(() => import('./widgets/LeaderElectionDemo'), { loading: () => <WidgetLoader /> }),
  'config-propagator': dynamic(() => import('./widgets/ConfigPropagator'), { loading: () => <WidgetLoader /> }),
  'secret-vault': dynamic(() => import('./widgets/SecretVault'), { loading: () => <WidgetLoader /> }),
  'pipeline-visualizer': dynamic(() => import('./widgets/PipelineVisualizer'), { loading: () => <WidgetLoader /> }),
  'service-mesh-viz': dynamic(() => import('./widgets/ServiceMeshViz'), { loading: () => <WidgetLoader /> }),
  'graphql-playground': dynamic(() => import('./widgets/GraphQLPlayground'), { loading: () => <WidgetLoader /> }),
  'rest-explorer': dynamic(() => import('./widgets/RESTExplorer'), { loading: () => <WidgetLoader /> }),
  'socket-pulse': dynamic(() => import('./widgets/SocketPulse'), { loading: () => <WidgetLoader /> }),
  'ot-visualizer': dynamic(() => import('./widgets/OTVisualizer'), { loading: () => <WidgetLoader /> }),
  'rtb-simulator': dynamic(() => import('./widgets/RTBSimulator'), { loading: () => <WidgetLoader /> }),
  'feed-ranker': dynamic(() => import('./widgets/FeedRanker'), { loading: () => <WidgetLoader /> }),
  'feature-toggle-demo': dynamic(() => import('./widgets/FeatureToggleDemo'), { loading: () => <WidgetLoader /> }),
  'sidecar-visualizer': dynamic(() => import('./widgets/SidecarVisualizer'), { loading: () => <WidgetLoader /> }),
  'trace-waterfall': dynamic(() => import('./widgets/TraceWaterfall'), { loading: () => <WidgetLoader /> }),
  'audit-log-visualizer': dynamic(() => import('./widgets/AuditLogVisualizer'), { loading: () => <WidgetLoader /> }),
  'privacy-request-manager': dynamic(() => import('./widgets/PrivacyRequestManager'), { loading: () => <WidgetLoader /> }),
  'blockchain-demo': dynamic(() => import('./widgets/BlockchainDemo'), { loading: () => <WidgetLoader /> }),
  'vector-db-visualizer': dynamic(() => import('./widgets/VectorDBVisualizer'), { loading: () => <WidgetLoader /> }),
  'rag-architect': dynamic(() => import('./widgets/RAGArchitect'), { loading: () => <WidgetLoader /> }),
  'agent-orchestrator': dynamic(() => import('./widgets/AgentOrchestrator'), { loading: () => <WidgetLoader /> }),
  'job-scheduler-viz': dynamic(() => import('./widgets/JobSchedulerViz'), { loading: () => <WidgetLoader /> }),
  'flash-sale-demo': dynamic(() => import('./widgets/FlashSaleDemo'), { loading: () => <WidgetLoader /> }),
  'payment-ledger': dynamic(() => import('./widgets/PaymentLedger'), { loading: () => <WidgetLoader /> }),
};

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
  diagramData?: {
    imageData?: string;
    elements?: any[];
    description?: string;
  } | null;
}

interface Props {
  problem: SystemDesignProblem;
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

function findResumePosition(
  phaseSteps: Record<string, unknown[]>,
  completedSteps: Set<string>
): { phase: string; stepIndex: number } {
  const phaseKeys = Object.keys(phaseSteps);
  for (const phaseKey of phaseKeys) {
    const steps = phaseSteps[phaseKey];
    for (let i = 0; i < steps.length; i++) {
      if (!completedSteps.has(`${phaseKey}-${i}`)) {
        return { phase: phaseKey, stepIndex: i };
      }
    }
  }
  const lastPhase = phaseKeys[phaseKeys.length - 1];
  const lastSteps = phaseSteps[lastPhase] ?? [];
  return { phase: lastPhase ?? 'requirements', stepIndex: Math.max(0, lastSteps.length - 1) };
}

export default function StepByStepChat({ problem }: Props) {
  const [currentPhase, setCurrentPhase] = useState(() => {
    const keys = Object.keys(resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS));
    return keys[0] ?? 'requirements';
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [listItems, setListItems] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [schemaData, setSchemaData] = useState<any[]>([]);
  const [newItemInput, setNewItemInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Store all step data
  const [savedStepData, setSavedStepData] = useState<Map<string, SavedStepData>>(new Map());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Session restoration state
  const [sessionRestored, setSessionRestored] = useState(false);
  const [restoredDate, setRestoredDate] = useState<Date | null>(null);
  const [dismissedRestoreBanner, setDismissedRestoreBanner] = useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);

  // Diagram tracking - now per step
  const [diagramData, setDiagramData] = useState<{
    imageData?: string;
    elements?: any[];
    description?: string;
  } | null>(null);

  const PHASE_STEPS = resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS);
  const phases = Object.keys(PHASE_STEPS);
  const effectivePhase = resolveEffectivePhase(currentPhase, phases);
  const currentSteps = PHASE_STEPS[effectivePhase] ?? [];
  const safeStepIndex = clampStepIndex(currentStepIndex, currentSteps.length);
  const currentStep = currentSteps[safeStepIndex];
  const currentStepKey = buildStepKey(effectivePhase, safeStepIndex);

  useEffect(() => {
    const phaseKeys = Object.keys(resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS));
    const nextPhase = resolveEffectivePhase(currentPhase, phaseKeys);
    const stepsInPhase = resolvePhaseSteps(problem.steps, DEFAULT_PHASE_STEPS)[nextPhase] ?? [];
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
        try {
          const startResult = await startPracticeSession(problem.id);
          if (isMounted && startResult.success && startResult.sessionId) {
            setActiveSessionId(startResult.sessionId);
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
  }, [problem.id, problem.slug, problem.steps, session?.user?.id, sessionStatus]);

  // Save session to localStorage as draft buffer
  useEffect(() => {
    if (!sessionRestored) return;

    const stateToSave = {
      currentPhase,
      currentStepIndex,
      savedStepData,
      completedSteps,
    };

    saveSessionState(problem.slug, stateToSave);
  }, [problem.slug, currentPhase, currentStepIndex, savedStepData, completedSteps, sessionRestored]);

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
    setSavedStepData(new Map());
    setSessionRestored(true);
    setRestoredDate(null);
    setDiagramData(null);

    sessionLoadedForRef.current = null;

    toast.success('Session cleared! Starting fresh.');
  }, [problem.id, problem.slug, session?.user]);

  // Listen for diagram sharing events
  useEffect(() => {
    const handleDiagramShared = (e: any) => {
      if (e?.detail) {
        const newDiagramData = {
          imageData: e.detail.imageData,
          elements: e.detail.elements,
          description: e.detail.description
        };
        setDiagramData(newDiagramData);

        // Save diagram data to current step
        const newSavedData = new Map(savedStepData);
        const currentSaved = newSavedData.get(currentStepKey) || {
          listItems: [],
          textInput: '',
          schemaData: [],
          feedback: null,
          completed: false
        };
        newSavedData.set(currentStepKey, {
          ...currentSaved,
          diagramData: newDiagramData
        });
        setSavedStepData(newSavedData);

        console.log('Diagram captured for step:', currentStepKey, e.detail.description);
      }
    };

    window.addEventListener('sd-diagram-shared', handleDiagramShared as EventListener);
    return () => {
      window.removeEventListener('sd-diagram-shared', handleDiagramShared as EventListener);
    };
  }, [currentStepKey, savedStepData]);

  // Load saved form data when navigating between steps. Feedback modal opens only
  // from handleSubmit — never re-open from saved state (that caused modal flicker/loops).
  useEffect(() => {
    const saved = savedStepData.get(currentStepKey);
    if (saved) {
      setListItems(saved.listItems);
      setTextInput(saved.textInput);
      setSchemaData(saved.schemaData || []);
      setFeedback(saved.feedback);
      setDiagramData(saved.diagramData || null);
    } else {
      setListItems([]);
      setTextInput('');
      setSchemaData([]);
      setFeedback(null);
      setDiagramData(null);
    }
    setShowFeedback(false);
    setNewItemInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset form on step navigation
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

    try {
      const requestBody: any = {
        problem: problem.slug,
        phase: currentStep.phase,
        phaseKey: effectivePhase,
        subStep: currentStep.subStep,
        userAnswer,
        problemDetails: problem
      };

      // Add diagram data if available and relevant
      // Add diagram data if available and relevant
      // Try to get live data from global helpers first
      const getElements = (window as any).sd_getDiagramElements;
      const getDescription = (window as any).sd_getDiagramDescription;
      let usedDiagramData = diagramData;

      if (getElements && getDescription) {
        const elements = getElements();
        const description = getDescription();
        if (elements && elements.length > 0) {
          usedDiagramData = {
            elements,
            description,
            // imageData not needed for evaluation
          };
        }
      }

      if (shouldIncludeDiagram && usedDiagramData) {
        requestBody.diagramData = {
          description: usedDiagramData.description,
          elementCount: usedDiagramData.elements?.length || 0,
          components: usedDiagramData.elements?.map((el: any) => el.type).filter((t: string) => t !== 'arrow' && t !== 'line')
        };
        requestBody.userAnswer = `${userAnswer}\n\n[Diagram included with ${usedDiagramData.elements?.length || 0} components: ${usedDiagramData.description}]`;
      } else if (shouldIncludeDiagram && !usedDiagramData) {
        // Warn if diagram is expected but not provided
        requestBody.userAnswer = `${userAnswer}\n\n[Note: No diagram was created for this architecture description]`;
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
        diagramData: diagramData
      });
      setSavedStepData(newSavedData);

      const wasAlreadyCompleted = completedSteps.has(currentStepKey);

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
        const newCompleted = new Set(completedSteps).add(currentStepKey);
        setCompletedSteps(newCompleted);

        let totalStepsCount = 0;
        Object.values(PHASE_STEPS).forEach(steps => totalStepsCount += steps.length);

        if (newCompleted.size >= totalStepsCount && activeSessionId) {
          try {
            await completeSession(
              activeSessionId,
              Math.round(data.feedback.score),
              diagramData ?? undefined
            );
            toast.success('🎉 Problem Completed! You have finished all steps!');
          } catch (error) {
            console.error('Failed to complete session:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setFeedback({
        score: 0,
        accuracy: 0,
        strengths: [],
        weaknesses: ['Error connecting to AI. Please try again.'],
        missed: [],
        isAcceptable: false
      });
      setShowFeedback(true);
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
      diagramData: diagramData
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
              {' '}from {format(restoredDate, 'MMM d, yyyy · h:mm a')}
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
          {isDiagramSubStep(currentStep.subStep) && (
            <div className={`p-3 rounded-lg border-2 ${diagramData
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-orange-500/10 border-orange-500/30'
              }`}>
              <div className="flex items-center gap-2">
                {diagramData ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        Diagram Captured! ✓
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {diagramData.description} • Will be included in AI evaluation
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                        Tip: Create a Diagram
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Draw your architecture in the diagram canvas below, then click "Share with AI" before submitting
                      </p>
                    </div>
                  </>
                )}
              </div>
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
                    <p className="flex-1 text-sm">{item}</p>
                    {!showFeedback && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeListItem(index)}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity h-6 w-6 p-0"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
