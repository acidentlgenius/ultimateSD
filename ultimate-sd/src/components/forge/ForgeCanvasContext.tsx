'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import type { ForgeCanvasHandle } from '@/lib/forge/types';

const ForgeCanvasContext = createContext<React.RefObject<ForgeCanvasHandle | null> | null>(null);

export function ForgeCanvasProvider({ children }: { children: ReactNode }) {
  const forgeRef = useRef<ForgeCanvasHandle | null>(null);
  return (
    <ForgeCanvasContext.Provider value={forgeRef}>
      {children}
    </ForgeCanvasContext.Provider>
  );
}

export function useForgeCanvasRef(): React.RefObject<ForgeCanvasHandle | null> {
  const ref = useContext(ForgeCanvasContext);
  if (!ref) {
    throw new Error('useForgeCanvasRef must be used within ForgeCanvasProvider');
  }
  return ref;
}
