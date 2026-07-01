"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Layers, Maximize, Workflow, X } from 'lucide-react';
import DiagramCanvas from '@/components/DiagramCanvas';
import { DiagramCanvasProvider, useDiagramCanvasRef } from '@/components/diagram/DiagramCanvasContext';
import { exportPNG } from '@/lib/exportUtils';
import { cn } from '@/lib/utils';

type DiagramType = 'HLD' | 'LLD' | null;

export default function DrawPage() {
  return (
    <DiagramCanvasProvider>
      <DrawPageContent />
    </DiagramCanvasProvider>
  );
}

function DrawPageContent() {
  const diagramRef = useDiagramCanvasRef();
  const [diagramType, setDiagramType] = useState<DiagramType>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stepKey = diagramType ? `free-draw-${diagramType.toLowerCase()}` : '';

  const handleDownload = () => {
    if (!diagramType) return;
    void exportPNG({
      diagramType,
      toastZIndex: 'z-[60]',
      useLongTimestamp: true,
      getPngBlob: () => diagramRef.current?.getPng() ?? Promise.resolve(null),
    });
  };

  if (!diagramType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="mb-4 glass rounded-lg border border-border px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-primary to-primary/70 p-2">
              <Workflow className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold gradient-text">Free Drawing Canvas</h1>
          </div>
        </div>
        <Card className="glass border-2 p-8">
          <h2 className="mb-4 text-center text-xl font-semibold">Choose Diagram Type</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Select whether you want to create a High-Level Design or Low-Level Design diagram
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setDiagramType('HLD')}
              className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <Layers className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">High-Level Design (HLD)</h3>
              <p className="text-sm text-muted-foreground">
                System architecture with components, data flow, and infrastructure layout
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDiagramType('LLD')}
              className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Workflow className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Low-Level Design (LLD)</h3>
              <p className="text-sm text-muted-foreground">
                Detailed components with classes, modules, APIs, and relationships
              </p>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(isFullscreen && 'fixed inset-0 z-50 flex flex-col bg-background')}>
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'rounded px-2 py-1 text-xs font-semibold',
              diagramType === 'HLD'
                ? 'bg-blue-500/10 text-blue-600'
                : 'bg-green-500/10 text-green-600'
            )}
          >
            {diagramType}
          </span>
          <span className="text-sm text-muted-foreground">Free draw canvas</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1 h-3 w-3" />
            Download PNG
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <>
                <X className="mr-1 h-3 w-3" /> Exit fullscreen
              </>
            ) : (
              <>
                <Maximize className="mr-1 h-3 w-3" /> Fullscreen
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Switch diagram type? This will clear the current canvas.')) {
                diagramRef.current?.clear(true);
                setDiagramType(null);
                setIsFullscreen(false);
              }
            }}
          >
            Switch type
          </Button>
        </div>
      </div>
      <div className={cn('min-h-0 flex-1', !isFullscreen && 'h-[calc(100vh-12rem)]')}>
        <DiagramCanvas stepKey={stepKey} isVisible />
      </div>
    </div>
  );
}
