/**
 * useCanvasContent — manages user-typed text across all canvas regions
 *
 * Stores text in local React state for immediate UX.
 * Debounces persistence to the server (API route: POST /api/canvas/progress).
 *
 * Key format convention: "<regionKey>.<fieldKey>"
 * Examples: "fr.custom", "nfr.custom", "entities.custom", "hld.notes"
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasContent, CanvasSnapshot, Seniority, StageIndex } from '../data/canvas-types';

const DEBOUNCE_MS = 1500;

export interface UseCanvasContentReturn {
  content: CanvasContent;
  setField: (key: string, value: string) => void;
  isSaving: boolean;
}

export function useCanvasContent(
  problemId: string,
  userId: string,
  getSnapshot: () => { stage: StageIndex; maxStage: StageIndex; seniority: Seniority },
  initialContent?: CanvasContent,
): UseCanvasContentReturn {
  const [content, setContent] = useState<CanvasContent>(initialContent ?? {});
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);

  // Keep ref in sync for use inside the debounce closure
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const persist = useCallback(async () => {
    setIsSaving(true);
    try {
      const { stage, maxStage, seniority } = getSnapshot();
      const snapshot: CanvasSnapshot = {
        stage,
        maxStage,
        seniority,
        content: contentRef.current,
        savedAt: new Date().toISOString(),
      };
      await fetch('/api/canvas/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, userId, snapshot }),
      });
    } catch {
      // Fail silently — user's text is still in state; we'll retry on next change
    } finally {
      setIsSaving(false);
    }
  }, [problemId, userId, getSnapshot]);

  const setField = useCallback(
    (key: string, value: string) => {
      setContent((prev) => ({ ...prev, [key]: value }));

      // Debounce the server write
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(persist, DEBOUNCE_MS);
    },
    [persist],
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        persist();
      }
    };
  }, [persist]);

  return { content, setField, isSaving };
}
