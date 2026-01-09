'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SystemDesignProblem } from '@/types';
import { tokens } from '@/styles/tokens';
import SchemaBuilder from '@/components/SchemaBuilder';
import {
  saveSessionState,
  loadSessionState,
  clearSessionState
} from '@/lib/session-storage';
import { updateProblemProgress, completeStep } from '@/app/actions/progress';
import FeedbackModal from './FeedbackModal';
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
  History
} from 'lucide-react';
import SubmissionHistory from './SubmissionHistory';

const WidgetSkeleton = () => (
  <div className="w-full h-64 bg-muted/20 animate-pulse rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground/50 text-sm">
    Loading widget...
  </div>
);

const EncodingVisualizer = dynamic(() => import('./widgets/EncodingVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const CapacityCalculator = dynamic(() => import('./widgets/CapacityCalculator'), { ssr: false, loading: () => <WidgetSkeleton /> });
const FanoutVisualizer = dynamic(() => import('./widgets/FanoutVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const FeedRankingSimulator = dynamic(() => import('./widgets/FeedRankingSimulator'), { ssr: false, loading: () => <WidgetSkeleton /> });
const QuadTreeVisualizer = dynamic(() => import('./widgets/QuadTreeVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const ABRSimulator = dynamic(() => import('./widgets/ABRSimulator'), { ssr: false, loading: () => <WidgetSkeleton /> });
const E2EEncryptionDemo = dynamic(() => import('./widgets/E2EEncryptionDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const FeedArchitect = dynamic(() => import('./widgets/FeedArchitect'), { ssr: false, loading: () => <WidgetSkeleton /> });
const InvertedIndexVisualizer = dynamic(() => import('./widgets/InvertedIndexVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const ChunkingDedupeDemo = dynamic(() => import('./widgets/ChunkingDedupeDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const RateLimiterDemo = dynamic(() => import('./widgets/RateLimiterDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const CacheVisualizer = dynamic(() => import('./widgets/CacheVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const TrieVisualizer = dynamic(() => import('./widgets/TrieVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const SnowflakeDemo = dynamic(() => import('./widgets/SnowflakeDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const LeaderboardSimulation = dynamic(() => import('./widgets/LeaderboardSimulation'), { ssr: false, loading: () => <WidgetSkeleton /> });
const NotificationSystemDemo = dynamic(() => import('./widgets/NotificationSystemDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const MetricsDashboard = dynamic(() => import('./widgets/MetricsDashboard'), { ssr: false, loading: () => <WidgetSkeleton /> });
const ConsistentHashingDemo = dynamic(() => import('./widgets/ConsistentHashingDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const LoadBalancerVisualizer = dynamic(() => import('./widgets/LoadBalancerVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const MessageQueueVisualizer = dynamic(() => import('./widgets/MessageQueueVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const CDNMap = dynamic(() => import('./widgets/CDNMap'), { ssr: false, loading: () => <WidgetSkeleton /> });
const CrawlerFrontier = dynamic(() => import('./widgets/CrawlerFrontier'), { ssr: false, loading: () => <WidgetSkeleton /> });
const DFSVisualizer = dynamic(() => import('./widgets/DFSVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const LeaderElectionDemo = dynamic(() => import('./widgets/LeaderElectionDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const ConfigPropagator = dynamic(() => import('./widgets/ConfigPropagator'), { ssr: false, loading: () => <WidgetSkeleton /> });
const SecretVault = dynamic(() => import('./widgets/SecretVault'), { ssr: false, loading: () => <WidgetSkeleton /> });
const PipelineVisualizer = dynamic(() => import('./widgets/PipelineVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const ServiceMeshViz = dynamic(() => import('./widgets/ServiceMeshViz'), { ssr: false, loading: () => <WidgetSkeleton /> });
const GraphQLPlayground = dynamic(() => import('./widgets/GraphQLPlayground'), { ssr: false, loading: () => <WidgetSkeleton /> });
const RESTExplorer = dynamic(() => import('./widgets/RESTExplorer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const SocketPulse = dynamic(() => import('./widgets/SocketPulse'), { ssr: false, loading: () => <WidgetSkeleton /> });
const OTVisualizer = dynamic(() => import('./widgets/OTVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const RTBSimulator = dynamic(() => import('./widgets/RTBSimulator'), { ssr: false, loading: () => <WidgetSkeleton /> });
const FeedRanker = dynamic(() => import('./widgets/FeedRanker'), { ssr: false, loading: () => <WidgetSkeleton /> });
const FeatureToggleDemo = dynamic(() => import('./widgets/FeatureToggleDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const SidecarVisualizer = dynamic(() => import('./widgets/SidecarVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const TraceWaterfall = dynamic(() => import('./widgets/TraceWaterfall'), { ssr: false, loading: () => <WidgetSkeleton /> });
const AuditLogVisualizer = dynamic(() => import('./widgets/AuditLogVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const PrivacyRequestManager = dynamic(() => import('./widgets/PrivacyRequestManager'), { ssr: false, loading: () => <WidgetSkeleton /> });
const BlockchainDemo = dynamic(() => import('./widgets/BlockchainDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const VectorDBVisualizer = dynamic(() => import('./widgets/VectorDBVisualizer'), { ssr: false, loading: () => <WidgetSkeleton /> });
const RAGArchitect = dynamic(() => import('./widgets/RAGArchitect'), { ssr: false, loading: () => <WidgetSkeleton /> });
const AgentOrchestrator = dynamic(() => import('./widgets/AgentOrchestrator'), { ssr: false, loading: () => <WidgetSkeleton /> });
const JobSchedulerViz = dynamic(() => import('./widgets/JobSchedulerViz'), { ssr: false, loading: () => <WidgetSkeleton /> });
const FlashSaleDemo = dynamic(() => import('./widgets/FlashSaleDemo'), { ssr: false, loading: () => <WidgetSkeleton /> });
const PaymentLedger = dynamic(() => import('./widgets/PaymentLedger'), { ssr: false, loading: () => <WidgetSkeleton /> });

const WIDGETS: Record<string, React.ComponentType> = {
  'encoding-visualizer': EncodingVisualizer,
  'capacity-calculator': CapacityCalculator,
  'fanout-visualizer': FanoutVisualizer,
  'feed-ranking-simulator': FeedRankingSimulator,
  'quadtree-visualizer': QuadTreeVisualizer,
  'abr-simulator': ABRSimulator,
  'e2e-encryption-demo': E2EEncryptionDemo,
  'feed-architect': FeedArchitect,
  'inverted-index-visualizer': InvertedIndexVisualizer,
  'chunking-dedupe-demo': ChunkingDedupeDemo,
  'rate-limiter-demo': RateLimiterDemo,
  'cache-visualizer': CacheVisualizer,
  'trie-visualizer': TrieVisualizer,
  'snowflake-demo': SnowflakeDemo,
  'leaderboard-simulation': LeaderboardSimulation,
  'notification-system-demo': NotificationSystemDemo,
  'metrics-dashboard': MetricsDashboard,
  'consistent-hashing-demo': ConsistentHashingDemo,
  'load-balancer-visualizer': LoadBalancerVisualizer,
  'message-queue-visualizer': MessageQueueVisualizer,
  'cdn-map': CDNMap,
  'crawler-frontier': CrawlerFrontier,
  'dfs-visualizer': DFSVisualizer,
  'leader-election-demo': LeaderElectionDemo,
  'config-propagator': ConfigPropagator,
  'secret-vault': SecretVault,
  'pipeline-visualizer': PipelineVisualizer,
  'service-mesh-viz': ServiceMeshViz,
  'graphql-playground': GraphQLPlayground,
  'rest-explorer': RESTExplorer,
  'socket-pulse': SocketPulse,
  'ot-visualizer': OTVisualizer,
  'rtb-simulator': RTBSimulator,
  'feed-ranker': FeedRanker,
  'feature-toggle-demo': FeatureToggleDemo,
  'sidecar-visualizer': SidecarVisualizer,
  'trace-waterfall': TraceWaterfall,
  'audit-log-visualizer': AuditLogVisualizer,
  'privacy-request-manager': PrivacyRequestManager,
  'blockchain-demo': BlockchainDemo,
  'vector-db-visualizer': VectorDBVisualizer,
  'rag-architect': RAGArchitect,
  'agent-orchestrator': AgentOrchestrator,
  'job-scheduler-viz': JobSchedulerViz,
  'flash-sale-demo': FlashSaleDemo,
  'payment-ledger': PaymentLedger,
};

import { DEFAULT_PHASE_STEPS } from '@/lib/steps';

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

export default function StepByStepChat({ problem }: Props) {
  const [currentPhase, setCurrentPhase] = useState('requirements');
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

  // Session restoration state
  const [sessionRestored, setSessionRestored] = useState(false);
  const [restoredDate, setRestoredDate] = useState<Date | null>(null);

  // Diagram tracking - now per step
  const [diagramData, setDiagramData] = useState<{
    imageData?: string;
    elements?: any[];
    description?: string;
  } | null>(null);

  const PHASE_STEPS = problem.steps || DEFAULT_PHASE_STEPS;
  const phases = Object.keys(PHASE_STEPS);
  // Ensure currentPhase is valid for this problem, fallback to first phase if not
  const validCurrentPhase = phases.includes(currentPhase) ? currentPhase : phases[0];

  // If we had to correct the phase, update state effectively
  if (currentPhase !== validCurrentPhase && phases.length > 0) {
    // This side effect in render is not ideal but prevents crashing.
    // Better would be a useEffect, but let's just use the valid one for now.
    // We can't call setCurrentPhase here directly.
  }

  const effectivePhase = phases.includes(currentPhase) ? currentPhase : phases[0];
  const currentSteps = PHASE_STEPS[effectivePhase];
  const currentStep = currentSteps[currentStepIndex];

  // Get step key for storage
  const getStepKey = (phase: string, stepIdx: number) => `${phase}-${stepIdx}`;
  const currentStepKey = getStepKey(currentPhase, currentStepIndex);

  // Load session from localStorage on mount
  useEffect(() => {
    const restored = loadSessionState(problem.slug);
    if (restored) {
      setCurrentPhase(restored.currentPhase);
      setCurrentStepIndex(restored.currentStepIndex);
      setSavedStepData(restored.savedStepData);
      setCompletedSteps(restored.completedSteps);
      setSessionRestored(true);
      setRestoredDate(restored.lastUpdated);

      console.log('Session restored from', restored.lastUpdated);


    }
  }, [problem.slug]);

  // Save session to localStorage whenever state changes
  useEffect(() => {
    if (sessionRestored || savedStepData.size > 0) {
      const saved = saveSessionState(problem.slug, {
        currentPhase,
        currentStepIndex,
        savedStepData,
        completedSteps,
      });

      if (saved) {
        console.log('Session saved to localStorage');
      }
    }
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

  // Clear session handler
  const handleClearSession = useCallback(() => {
    clearSessionState(problem.slug);

    // Clear diagram data from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('diagram-')) {
        localStorage.removeItem(key);
      }
    });

    // Reset all state
    setCurrentPhase('requirements');
    setCurrentStepIndex(0);
    setListItems([]);
    setTextInput('');
    setSchemaData([]);
    setFeedback(null);
    setShowFeedback(false);
    setCompletedSteps(new Set());
    setSavedStepData(new Map());
    setSessionRestored(false);
    setRestoredDate(null);
    setDiagramData(null);

    toast.success('Session cleared! Starting fresh.');
  }, [problem.slug]);

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

  // Load saved data when step changes
  useEffect(() => {
    const saved = savedStepData.get(currentStepKey);
    if (saved) {
      setListItems(saved.listItems);
      setTextInput(saved.textInput);
      setSchemaData(saved.schemaData || []);
      setFeedback(saved.feedback);
      setShowFeedback(saved.feedback !== null);
      setDiagramData(saved.diagramData || null);
    } else {
      setListItems([]);
      setTextInput('');
      setSchemaData([]);
      setFeedback(null);
      setShowFeedback(false);
      setDiagramData(null);
    }
    setNewItemInput('');
  }, [currentStepKey, savedStepData]);

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
    const shouldIncludeDiagram = currentStep.subStep === 'architecture' || currentStep.subStep === 'data-flow';

    setLoading(true);
    setShowFeedback(false);

    try {
      const requestBody: any = {
        problem: problem.slug,
        phase: currentStep.phase,
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

      const res = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      setFeedback(data.feedback);
      setShowFeedback(true);

      // Save step data
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

      if (data.feedback.isAcceptable) {
        const newCompleted = new Set(completedSteps).add(currentStepKey);
        setCompletedSteps(newCompleted);

        // Check if ALL steps are completed
        let totalStepsCount = 0;
        Object.values(PHASE_STEPS).forEach(steps => totalStepsCount += steps.length);

        if (newCompleted.size >= totalStepsCount) {
          // Calculate average score (simplified for now, just using last acceptable score)
          // In a real app we might average all step scores
          await updateProblemProgress(problem.id, 'COMPLETED', Math.round(data.feedback.score));
          toast.success('🎉 Problem Completed! You have finished all steps!');
        }

        // Award XP for completing the step
        try {
          const result = await completeStep(problem.id, currentStepKey, {
            content: userAnswer,
            feedback: JSON.stringify(data.feedback),
            score: Math.round(data.feedback.score),
            isPassing: data.feedback.isAcceptable
          });
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
            } else {
              toast.info('Step Updated (Already Completed)', {
                icon: '✓',
                className: 'bg-muted border-border text-muted-foreground'
              });
            }
          }
        } catch (error) {
          console.error('Failed to update XP:', error);
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
    if (currentStepIndex < currentSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Move to next phase
      const currentPhaseIndex = phases.indexOf(currentPhase);
      if (currentPhaseIndex < phases.length - 1) {
        setCurrentPhase(phases[currentPhaseIndex + 1]);
        setCurrentStepIndex(0);
      } else {
        // All done
        toast.success('🎉 Congratulations! You have completed all sections!');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      // Move to previous phase
      const currentPhaseIndex = phases.indexOf(currentPhase);
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
    setFeedback(null);
  };

  const getPhaseColor = (phase: string) => {
    const phaseKey = phase.toLowerCase().replace('-', '').replace(' ', '') as keyof typeof tokens.colors.phase;
    return tokens.colors.phase[phaseKey] || tokens.colors.info;
  };

  const progress = ((currentStepIndex + 1) / currentSteps.length) * 100;
  const isFirstStep = currentPhase === 'requirements' && currentStepIndex === 0;
  const canGoBack = !isFirstStep;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Session Restoration Banner Removed */}

      {/* Navigation and Header removed for Sidebar Layout Refactor */}

      {/* Step Content */}
      <Card className="glass border-2 border-border">
        <div className="p-6 space-y-6">
          {/* Question/Prompt */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{currentStep.title}</h3>
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
          {(currentStep.subStep === 'architecture' || currentStep.subStep === 'data-flow') && (
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* Add new item - only show if not showing feedback */}
                {!showFeedback && (
                  <div className="flex gap-2">
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
                      className="shrink-0"
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
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-2">
                  {canGoBack && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-muted-foreground"
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
                  className="gradient-bg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      {(currentStep.subStep === 'architecture' || currentStep.subStep === 'data-flow')
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

      {/* Session Info Footer Removed */}
    </div>
  );
}
