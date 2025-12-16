"use client";

import { useEffect, useState } from 'react';
import StepByStepChat from './StepByStepChat';
import DiagramCanvas from './DiagramCanvas';
import FeedbackModal from './FeedbackModal';
import { HelpAssistant } from './HelpAssistant';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';
import { Download, ChevronsDown, ChevronsUp, Home, Sparkles, Layout, Pencil, Loader2 } from 'lucide-react';
import { SystemDesignProblem } from '@/types';
import { tokens } from '@/styles/tokens';
import Link from 'next/link';
import { exportPracticeSession } from '@/lib/pdf-export-compact';
import { getThemeForProblem } from '@/lib/themes';
import { toast } from 'sonner';

import { DEFAULT_PHASE_STEPS } from '@/lib/steps';

// const PHASES = ['Requirements', 'HLD', 'LLD', 'Trade-offs', 'Scalability', 'Feedback'];

export default function PracticeUI({ problem }: { problem: SystemDesignProblem }) {
  const activeSteps = problem.steps || DEFAULT_PHASE_STEPS;
  // Get unique phase titles from the steps configuration
  const PHASES = Object.keys(activeSteps).map(key => {
    const steps = activeSteps[key];
    return steps.length > 0 ? steps[0].phase : key;
  });
  // Add Feedback phase if not present (logic implies it's usually separate, but let's see)
  // The original PHASES had 'Feedback' at the end. 
  // StepByStepChat doesn't seem to have a 'feedback' phase key in DEFAULT_PHASE_STEPS.
  // It handles completion differently.
  // Actually, let's keep it if it was there for visual consistency, or just rely on the step configuration.
  // The original code had 'Feedback' in PHASES array, but StepByStepChat only had keys: requirements, hld, lld, tradeoffs, scalability.
  // So 'Feedback' was likely a visual-only phase or handled specially?
  // Looking at StepByStepChat: "handleNext" -> alert "Congratulations". It doesn't switch to a Feedback phase state.
  // But PracticeUI has a FeedbackModal?
  // Let's keep PHASES as derived from steps. If we want 'Feedback' visually we can append it.

  const [phase, setPhase] = useState<string>(PHASES[0] || 'Requirements');
  const [currentSubStep, setCurrentSubStep] = useState<string>('');
  const [currentStepKey, setCurrentStepKey] = useState<string>('');
  const [diagramCollapsed, setDiagramCollapsed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [savedStepData, setSavedStepData] = useState<Map<string, any>>(new Map());
  const [isExporting, setIsExporting] = useState(false);

  // Diagram is only relevant for High Level Architecture and Data Flow steps
  const isDiagramRelevant = currentSubStep === 'architecture' || currentSubStep === 'data-flow';

  const getPhaseColor = (currentPhase: string) => {
    const phaseKey = currentPhase.toLowerCase().replace(' ', '') as keyof typeof tokens.colors.phase;
    return tokens.colors.phase[phaseKey] || tokens.colors.info;
  };

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.phase) setPhase(e.detail.phase);
      if (e?.detail?.subStep) setCurrentSubStep(e.detail.subStep);
      if (e?.detail?.stepKey) setCurrentStepKey(e.detail.stepKey);
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

  const exportTranscript = async () => {
    setIsExporting(true);

    try {
      await exportPracticeSession({
        problem,
        savedStepData,
      });

      // Show success message (simple alert for now, can be replaced with toast)
      toast.success('PDF exported successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF. Please try again or contact support if the issue persists.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4">
        {/* Enhanced header with glassmorphism */}
        <div className="mb-6 glass rounded-xl p-6 border-2 border-border shadow-lg animate-fade-in relative overflow-hidden">
          {/* Subtle background glow based on theme */}
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${theme.gradient} opacity-10 blur-3xl rounded-full -mr-20 -mt-20`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr ${theme.gradient} opacity-10 blur-2xl rounded-full -ml-16 -mb-16`} />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-md text-white`}>
                <Icon className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent mb-1`}>
                  {problem.title}
                </h1>
                <p className="text-sm text-muted-foreground font-medium">{problem.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <Link href="/">
                <Button variant="outline" size="sm" className="hover:bg-muted transition-all">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={exportTranscript}
                disabled={isExporting}
                className="hover:bg-muted transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* Phase progress indicator */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {PHASES.map((p, idx) => (
              <div key={p} className="flex items-center">
                <div
                  className={`text-xs px-4 py-2 rounded-full font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${p === phase
                    ? `text-white shadow-lg scale-105 ${theme.accent}`
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                    }`}
                  style={p === phase ? { backgroundColor: getPhaseColor(p), backgroundImage: p === phase ? `linear-gradient(135deg, ${theme.gradient})` : undefined } : {}}
                >
                  {p}
                  {(p === 'HLD' || p === 'LLD') && (
                    <Pencil className="h-3 w-3" />
                  )}
                </div>
                {idx < PHASES.length - 1 && (
                  <div className="w-8 h-0.5 bg-border mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main content area - Chat (now expands vertically) */}
        <div className="w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
          <StepByStepChat problem={problem} />
        </div>

        {/* Diagram Section - Only show for High Level Architecture and Data Flow steps */}
        {isDiagramRelevant && (
          <>
            {/* Diagram available notification */}
            <div className="mt-6 p-4 glass rounded-lg border-2 border-primary/30 bg-primary/5 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pencil className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">System Diagram Now Available!</h3>
                  <p className="text-xs text-muted-foreground">
                    Use the diagram canvas below to visualize your system design
                  </p>
                </div>
              </div>
            </div>

            <div className={`mt-6 transition-all duration-300 animate-fade-in ${diagramCollapsed ? 'h-0 opacity-0 overflow-hidden' : 'min-h-[600px] h-[calc(100vh-200px)] opacity-100'}`} style={{ animationDelay: '200ms' }}>
              <div className="relative h-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDiagramCollapsed(!diagramCollapsed)}
                  className="absolute -top-12 right-0 z-10 shadow-lg"
                >
                  <Layout className="h-4 w-4 mr-2" />
                  {diagramCollapsed ? 'Show Diagram' : 'Hide Diagram'}
                  {diagramCollapsed ? <ChevronsDown className="h-4 w-4 ml-2" /> : <ChevronsUp className="h-4 w-4 ml-2" />}
                </Button>
                <DiagramCanvas stepKey={currentStepKey} />
              </div>
            </div>

            {/* Floating diagram toggle when collapsed */}
            {diagramCollapsed && (
              <Button
                variant="default"
                size="lg"
                onClick={() => setDiagramCollapsed(false)}
                className="fixed bottom-8 right-8 shadow-2xl z-50 gradient-bg animate-bounce"
              >
                <Layout className="h-5 w-5 mr-2" />
                Show Diagram Canvas
                <ChevronsDown className="h-5 w-5 ml-2" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Help Assistant */}
      <HelpAssistant
        problem={problem}
        currentPhase={phase}
        completedSteps={completedSteps}
        savedStepData={savedStepData}
      />
    </div>
  );
}
