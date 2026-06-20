"use client";

import { useEffect, useState } from 'react';
import StepByStepChat from './StepByStepChat';
import DiagramCanvas from './DiagramCanvas';
import { TimerWidget } from './TimerWidget';
import { HelpAssistant } from './HelpAssistant';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Download, Layout, Loader2, Menu, X, Lock } from 'lucide-react';
import { SystemDesignProblem } from '@/types';
import Link from 'next/link';
import { exportPracticeSession } from '@/lib/pdf-export-compact';
import { getThemeForProblem } from '@/lib/themes';
import { toast } from 'sonner';

import { useSession } from 'next-auth/react';

import { DEFAULT_PHASE_STEPS } from '@/lib/steps';
import { SolutionViewer } from './SolutionViewer';
import { getSolution } from '@/lib/solutions';

import { updateProblemProgress, startPracticeSession } from '@/app/actions/progress';
import { CheckCircle } from 'lucide-react';

export default function PracticeUI({ problem, existingProgress }: { problem: SystemDesignProblem, existingProgress?: any }) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedStepData, setSavedStepData] = useState<Map<string, any>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  // Timer State
  const [serverStartedAt, setServerStartedAt] = useState<Date | string | null>((existingProgress as any)?.startedAt ?? null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>((existingProgress as any)?.isTimerRunning ?? true);
  const [serverPausedSeconds, setServerPausedSeconds] = useState<number>((existingProgress as any)?.totalPausedSeconds ?? 0);
  const [lastPausedAt, setLastPausedAt] = useState<Date | string | null>((existingProgress as any)?.lastPausedAt ?? null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDiagramRelevant = currentSubStep === 'architecture' || currentSubStep === 'data-flow';



  // Auto-mark in progress and START TIMER on mount (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated || !problem.id) return;

    const initSession = async () => {
      try {
        const result = await startPracticeSession(problem.id);

        if (result.success && result.startedAt) {
          setServerStartedAt(result.startedAt);
          setIsTimerRunning((result as any).isTimerRunning);
          setServerPausedSeconds((result as any).totalPausedSeconds);
          setLastPausedAt((result as any).lastPausedAt);
        }
      } catch (error) {
        console.error("Failed to auto-start session:", error);
      }
    };
    initSession();
  }, [problem.id, isAuthenticated]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const solution = getSolution(problem.slug);

  const handleUnlockSolution = () => {
    if (solution) {
      setIsSolutionOpen(true);
    }
  };

  const exportTranscript = async () => {
    setIsExporting(true);
    try {
      await exportPracticeSession({
        problem,
        savedStepData,
      });
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
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient} shadow-md text-white`}>
              <Icon className="h-5 w-5" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate leading-tight">
              {problem.title}
            </h1>
            <p className="text-xs text-muted-foreground truncate">System Design Practice</p>
          </div>
        </div>

        {/* Interview Timer */}
        <div className="mb-4">
          <TimerWidget
            className="w-full justify-between"
            problemId={problem.id}
            initialTimeSeconds={
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
              const result = await import('@/app/actions/progress').then(mod => mod.togglePracticeTimer(problem.id));
              if (result.success) {
                setIsTimerRunning(result.isTimerRunning);
                setServerPausedSeconds(result.totalPausedSeconds);
                setLastPausedAt(result.lastPausedAt);
              }
            }}
            onComplete={async () => {
              toast.warning("Time's up! The practice session has ended.");
            }}
          />
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
        <Button
          variant="outline"
          size="sm"
          className={`w-full justify-start ${!solution ? 'opacity-50' : 'hover:bg-amber-500/10 hover:text-amber-600'}`}
          onClick={handleUnlockSolution}
          disabled={!solution}
        >
          {solution ? 'View Solution' : 'Solution Locked'}
        </Button>

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
        <div className="flex items-center gap-3">
          {isMounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2" aria-label="Toggle menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 border-r border-border">
                {renderSidebar()}
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="-ml-2" aria-label="Toggle menu">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <span className="font-semibold text-sm truncate">{problem.title}</span>
        </div>
        <Link href="/">
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

          {/* Main Chat Interface */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <StepByStepChat problem={problem} />
          </div>

          {/* Diagram Section - Floating or Inline */}
          {isDiagramRelevant && (
            <div className="mt-8 animate-fade-in space-y-4">
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

              <div className={`transition-all duration-300 border-2 border-border/60 rounded-xl overflow-hidden shadow-sm bg-card ${diagramCollapsed ? 'h-0 opacity-0' : 'h-[600px] opacity-100'}`}>
                <DiagramCanvas stepKey={currentStepKey} />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Help Assistant */}
      <HelpAssistant
        problem={problem}
        currentPhase={phase}
        completedSteps={completedSteps}
        savedStepData={savedStepData}
      />


      <SolutionViewer
        isOpen={isSolutionOpen}
        onClose={() => setIsSolutionOpen(false)}
        solution={getSolution(problem.slug)}
      />
    </div >
  );
}
