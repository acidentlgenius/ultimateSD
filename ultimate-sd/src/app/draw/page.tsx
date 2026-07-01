"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Layers, Workflow, X } from 'lucide-react';
import DiagramCanvas from '@/components/DiagramCanvas';
import { exportPNG } from '@/lib/exportUtils';
import { safeGetJSON } from '@/lib/localStorageUtils';

type DiagramType = 'HLD' | 'LLD' | null;

export default function DrawPage() {
  const [diagramType, setDiagramType] = useState<DiagramType>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Handle fullscreen toggle with native Fullscreen API
  const toggleFullscreen = async () => {
    if (!isFullscreen && diagramType) {
      // Before entering fullscreen, save current state to localStorage
      if ((window as any).sd_saveToLocalStorage) {
        (window as any).sd_saveToLocalStorage(`free-draw-${diagramType.toLowerCase()}`);
      }

      // First show the fullscreen container
      setIsFullscreen(true);

      // Wait for React to render the fullscreen div before requesting fullscreen
      await new Promise(resolve => setTimeout(resolve, 50));

      // Enter native fullscreen
      if (fullscreenRef.current) {
        try {
          if (fullscreenRef.current.requestFullscreen) {
            await fullscreenRef.current.requestFullscreen();
          } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
            await (fullscreenRef.current as any).webkitRequestFullscreen();
          } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
            await (fullscreenRef.current as any).mozRequestFullScreen();
          } else if ((fullscreenRef.current as any).msRequestFullscreen) {
            await (fullscreenRef.current as any).msRequestFullscreen();
          }
        } catch (err) {
          console.error('Error entering fullscreen:', err);
          // If fullscreen fails, stay in the overlay mode
        }
      }
    } else if (isFullscreen) {
      // Exit native fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);

        // When exiting fullscreen, trigger a reload of the canvas
        setTimeout(() => {
          const storageKey = `diagram-free-draw-${diagramType?.toLowerCase()}`;
          const diagramData = safeGetJSON<any>(storageKey);
          if (diagramData && (window as any).sd_loadDiagramElements) {
            (window as any).sd_loadDiagramElements(diagramData.elements || []);
          }
        }, 100);
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      // Detect when user exits fullscreen via browser controls (ESC or F11)
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      if (!isCurrentlyFullscreen && isFullscreen) {
        setIsFullscreen(false);
        // Reload canvas state when exiting
        setTimeout(() => {
          const storageKey = `diagram-free-draw-${diagramType?.toLowerCase()}`;
          const diagramData = safeGetJSON<any>(storageKey);
          if (diagramData && (window as any).sd_loadDiagramElements) {
            (window as any).sd_loadDiagramElements(diagramData.elements || []);
          }
        }, 100);
      }
    };

    window.addEventListener('keydown', handleEsc);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, diagramType]);


  return (
    <>
      {/* Fullscreen Mode */}
      {isFullscreen && diagramType && (
        <div 
          ref={fullscreenRef}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Minimal Fullscreen Header */}
          <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  diagramType === 'HLD' 
                    ? 'bg-blue-500/10 text-blue-600' 
                    : 'bg-green-500/10 text-green-600'
                }`}>
                  {diagramType === 'HLD' ? 'HLD' : 'LLD'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">ESC</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">F11</kbd> to exit
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => exportPNG({ diagramType, toastZIndex: 'z-[60]', useLongTimestamp: true })}
                  className="h-7 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleFullscreen}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Exit
                </Button>
              </div>
            </div>
          </div>

          {/* Fullscreen Canvas - Takes full remaining space */}
          <div className="flex-1 overflow-hidden">
            <DiagramCanvas key={`free-draw-${diagramType.toLowerCase()}`} stepKey={`free-draw-${diagramType.toLowerCase()}`} />
          </div>
        </div>
      )}

      {/* Normal Mode - hide when fullscreen */}
      <div className={`min-h-screen bg-gradient-to-br from-background via-background to-muted/20 ${isFullscreen ? 'hidden' : ''}`}>
        <div className="w-full p-4">
        {/* Minimal Header */}
        <div className="mb-4 glass rounded-lg px-4 py-3 border border-border shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <Workflow className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold gradient-text">Free Drawing Canvas</h1>
            {diagramType && (
              <div className={`ml-2 px-3 py-1 rounded text-xs font-semibold ${
                diagramType === 'HLD' 
                  ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                  : 'bg-green-500/10 text-green-600 border border-green-500/20'
              }`}>
                {diagramType}
              </div>
            )}
          </div>
        </div>

        {/* Diagram Type Selection */}
        {!diagramType && (
          <div className="mb-6 animate-fade-in">
            <Card className="p-8 glass border-2">
              <h2 className="text-xl font-semibold mb-4 text-center">Choose Diagram Type</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Select whether you want to create a High-Level Design or Low-Level Design diagram
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => setDiagramType('HLD')}
                  className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-8 hover:border-primary transition-all duration-300 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Layers className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">High-Level Design (HLD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Create system architecture diagrams with components like servers, databases, load balancers, and their interactions
                    </p>
                    <ul className="mt-4 text-xs text-muted-foreground space-y-1">
                      <li>• System components & services</li>
                      <li>• Data flow & communication</li>
                      <li>• Infrastructure layout</li>
                    </ul>
                  </div>
                </button>

                <button
                  onClick={() => setDiagramType('LLD')}
                  className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-8 hover:border-primary transition-all duration-300 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Workflow className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Low-Level Design (LLD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Create detailed component diagrams with classes, modules, APIs, and their detailed relationships
                    </p>
                    <ul className="mt-4 text-xs text-muted-foreground space-y-1">
                      <li>• Classes & interfaces</li>
                      <li>• Methods & data structures</li>
                      <li>• Detailed relationships</li>
                    </ul>
                  </div>
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Canvas Area */}
        {diagramType && (
          <div className="animate-fade-in">
            {/* Compact controls */}
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {diagramType === 'HLD' 
                  ? 'Create system architecture with components & services' 
                  : 'Design detailed components with classes & methods'}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm('Switch diagram type? This will clear the current canvas.')) {
                    if ((window as any).sd_clearDiagram) {
                      (window as any).sd_clearDiagram();
                    }
                    setDiagramType(null);
                  }
                }}
              >
                Switch Type
              </Button>
            </div>

            {/* Canvas */}
            <div className="min-h-[700px] h-[calc(100vh-180px)]">
              <DiagramCanvas key={`free-draw-${diagramType.toLowerCase()}`} stepKey={`free-draw-${diagramType.toLowerCase()}`} />
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
