'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import type { DiagramCanvasHandle } from '@/types/diagram';

const DiagramCanvasContext = createContext<React.RefObject<DiagramCanvasHandle | null> | null>(null);

export function DiagramCanvasProvider({ children }: { children: ReactNode }) {
  const diagramRef = useRef<DiagramCanvasHandle | null>(null);
  return (
    <DiagramCanvasContext.Provider value={diagramRef}>
      {children}
    </DiagramCanvasContext.Provider>
  );
}

export function useDiagramCanvasRef(): React.RefObject<DiagramCanvasHandle | null> {
  const ref = useContext(DiagramCanvasContext);
  if (!ref) {
    throw new Error('useDiagramCanvasRef must be used within DiagramCanvasProvider');
  }
  return ref;
}
