"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, Download, Image as ImageIcon, Layers, Workflow, Maximize, Minimize, X } from 'lucide-react';
import Link from 'next/link';
import DiagramCanvas from '@/components/DiagramCanvas';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type DiagramType = 'HLD' | 'LLD' | null;

export default function DrawPage() {
  const [diagramType, setDiagramType] = useState<DiagramType>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen && diagramType) {
      // Before entering fullscreen, save current state to localStorage
      if ((window as any).sd_saveToLocalStorage) {
        (window as any).sd_saveToLocalStorage(`free-draw-${diagramType.toLowerCase()}`);
      }
    } else if (isFullscreen && diagramType) {
      // When exiting fullscreen, trigger a reload of the canvas
      setTimeout(() => {
        const savedData = localStorage.getItem(`diagram-free-draw-${diagramType.toLowerCase()}`);
        if (savedData && (window as any).sd_loadDiagramElements) {
          try {
            const diagramData = JSON.parse(savedData);
            (window as any).sd_loadDiagramElements(diagramData.elements || []);
          } catch (error) {
            console.error('Error reloading diagram:', error);
          }
        }
      }, 100);
    }
    setIsFullscreen(!isFullscreen);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const exportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('❌ No diagram found. Please draw something first!');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get bounding box of all elements for smart cropping
    const getBoundingBox = (window as any).sd_getBoundingBox;
    const elements = (window as any).sd_getDiagramElements?.();
    
    if (!getBoundingBox || !elements || elements.length === 0) {
      alert('❌ Your diagram is empty! Please add some components first.');
      return;
    }

    const bounds = getBoundingBox();
    const cropWidth = Math.ceil(bounds.maxX - bounds.minX);
    const cropHeight = Math.ceil(bounds.maxY - bounds.minY);

    // Create a temporary canvas with the cropped size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      // Fill with white background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, cropWidth, cropHeight);

      // Copy only the relevant portion of the canvas (cropped to content)
      tempCtx.drawImage(
        canvas,
        bounds.minX, bounds.minY, cropWidth, cropHeight, // Source rectangle
        0, 0, cropWidth, cropHeight // Destination rectangle
      );

      // Download with timestamp
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = diagramType 
        ? `${diagramType.toLowerCase()}-diagram-${timestamp}.png`
        : `diagram-${timestamp}.png`;
      link.download = fileName;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();

      // Show success toast with dimensions
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-[60] bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl animate-fade-in border-2 border-green-400';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full bg-white/20">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div class="font-semibold">Diagram exported successfully!</div>
            <div class="text-sm opacity-90">Size: ${cropWidth}×${cropHeight}px • ${diagramType} format</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };

  return (
    <>
      {/* Fullscreen Mode */}
      {isFullscreen && diagramType && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Fullscreen Header */}
          <div className="absolute top-0 left-0 right-0 z-10 glass border-b border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                  diagramType === 'HLD' 
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                    : 'bg-green-500/10 text-green-600 border border-green-500/20'
                }`}>
                  {diagramType === 'HLD' ? (
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" />
                      <span>High-Level Design</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Workflow className="h-3.5 w-3.5" />
                      <span>Low-Level Design</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">ESC</kbd> to exit fullscreen
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportPNG}
                  className="h-8"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleFullscreen}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Exit Fullscreen
                </Button>
              </div>
            </div>
          </div>

          {/* Fullscreen Canvas - same key to maintain state */}
          <div className="h-full pt-[73px]">
            <DiagramCanvas key={`free-draw-${diagramType.toLowerCase()}`} stepKey={`free-draw-${diagramType.toLowerCase()}`} />
          </div>
        </div>
      )}

      {/* Normal Mode - hide when fullscreen */}
      <div className={`min-h-screen bg-gradient-to-br from-background via-background to-muted/20 ${isFullscreen ? 'hidden' : ''}`}>
        <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6 glass rounded-xl p-6 border-2 border-border shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
                <Workflow className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold gradient-text mb-1">Free Drawing Canvas</h1>
                <p className="text-sm text-muted-foreground">
                  Create High-Level Design (HLD) or Low-Level Design (LLD) diagrams and export them
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <Link href="/">
                <Button variant="outline" size="sm" className="hover:bg-muted transition-all">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              {diagramType && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleFullscreen}
                  className="hover:bg-muted transition-all"
                >
                  <Maximize className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportPNG}
                disabled={!diagramType}
                className="hover:bg-muted transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              <ThemeToggle />
            </div>
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
            {/* Type indicator and controls */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  diagramType === 'HLD' 
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                    : 'bg-green-500/10 text-green-600 border border-green-500/20'
                }`}>
                  {diagramType === 'HLD' ? (
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>High-Level Design</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      <span>Low-Level Design</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (confirm('Switch diagram type? This will clear the current canvas.')) {
                      // Clear the canvas
                      if ((window as any).sd_clearDiagram) {
                        (window as any).sd_clearDiagram();
                      }
                      setDiagramType(null);
                    }
                  }}
                >
                  Switch Type
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={toggleFullscreen}
                  className="gradient-bg"
                >
                  <Maximize className="h-4 w-4 mr-2" />
                  Fullscreen Mode
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {diagramType === 'HLD' 
                  ? 'Draw your system architecture with high-level components'
                  : 'Draw detailed component designs with classes and methods'
                }
              </div>
            </div>

            {/* Canvas */}
            <div className="min-h-[600px] h-[calc(100vh-280px)]">
              <DiagramCanvas key={`free-draw-${diagramType.toLowerCase()}`} stepKey={`free-draw-${diagramType.toLowerCase()}`} />
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 glass rounded-lg border border-border">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Quick Tips
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use the toolbar to select different components (servers, databases, clients, etc.)</li>
                <li>• Click and drag to draw shapes, or click to place them</li>
                <li>• <strong>Resize elements:</strong> Select any shape and drag the blue corner handles to resize</li>
                <li>• Select mode (Move icon) to move or select existing elements</li>
                <li>• <strong>Double-click</strong> any element to edit its text or label</li>
                <li>• Add labels to components by selecting them and clicking "Label"</li>
                <li>• Use arrows to show data flow between components</li>
                <li>• Toggle grid on/off for easier alignment</li>
                <li>• <strong>Click "Fullscreen Mode"</strong> for distraction-free designing</li>
                <li>• Click "Download PNG" when done to save your diagram</li>
              </ul>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
