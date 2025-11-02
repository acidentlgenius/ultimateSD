"use client";

import { useEffect, useState } from 'react';
import ChatInterface from './ChatInterface';
import DiagramCanvas from './DiagramCanvas';
import FeedbackModal from './FeedbackModal';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';
import { Download, ChevronsDown, ChevronsUp, Home, Sparkles, Layout } from 'lucide-react';
import { SystemDesignProblem } from '@/types';
import { tokens } from '@/styles/tokens';
import Link from 'next/link';

const PHASES = ['Requirements', 'HLD', 'LLD', 'Trade-offs', 'Scalability', 'Feedback'];

export default function PracticeUI({ problem }: { problem: SystemDesignProblem }) {
  const [phase, setPhase] = useState<string>('Requirements');
  const [diagramCollapsed, setDiagramCollapsed] = useState(false);

  const getPhaseColor = (currentPhase: string) => {
    const phaseKey = currentPhase.toLowerCase().replace(' ', '') as keyof typeof tokens.colors.phase;
    return tokens.colors.phase[phaseKey] || tokens.colors.info;
  };

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.phase) setPhase(e.detail.phase);
    };
    window.addEventListener('sd-phase-change', handler as EventListener);

    return () => {
      window.removeEventListener('sd-phase-change', handler as EventListener);
    };
  }, []);

  const exportTranscript = () => {
    const getter = (window as any).sd_getMessages;
    const messages = typeof getter === 'function' ? getter() : [];
    const lines = messages.map((m: any) => `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${problem.slug || 'session'}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4">
        {/* Enhanced header with glassmorphism */}
        <div className="mb-6 glass rounded-xl p-6 border-2 border-border shadow-lg animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold gradient-text mb-1">{problem.title}</h1>
                <p className="text-sm text-muted-foreground">{problem.description}</p>
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
                className="hover:bg-muted transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* Phase progress indicator */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {PHASES.map((p, idx) => (
              <div key={p} className="flex items-center">
                <div
                  className={`text-xs px-4 py-2 rounded-full font-semibold transition-all duration-300 whitespace-nowrap ${
                    p === phase
                      ? 'text-white shadow-lg scale-105'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                  }`}
                  style={p === phase ? { backgroundColor: getPhaseColor(p) } : {}}
                >
                  {p}
                </div>
                {idx < PHASES.length - 1 && (
                  <div className="w-8 h-0.5 bg-border mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main content area - Chat */}
        <div className={`transition-all duration-300 animate-fade-in ${diagramCollapsed ? 'h-[calc(100vh-16rem)]' : 'h-[calc(50vh-8rem)]'} min-h-[400px]`} style={{ animationDelay: '100ms' }}>
          <ChatInterface problem={problem} />
        </div>

        {/* Diagram Section - Full Width Below */}
        <div className={`mt-6 transition-all duration-300 animate-fade-in ${diagramCollapsed ? 'h-0 opacity-0 overflow-hidden' : 'h-[calc(50vh-4rem)] opacity-100'}`} style={{ animationDelay: '200ms' }}>
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
            <DiagramCanvas />
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
      </div>
    </div>
  );
}
