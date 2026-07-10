'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import { useForgeCanvasRef } from './ForgeCanvasContext';
import { extractFrameText, extractSelectionText, focusFrame, activateNextFrame } from '@/lib/forge/frame-manager';
import { mergeFeedbackAnnotations } from '@/lib/forge/forge-annotations';
import { exportSceneToPng } from '@/lib/diagram-persistence';
import type { ParsedFeedback } from '@/types';
import { countActiveElements } from '@/lib/diagram-debug';
import { pickPersistedAppState, stripFilesForPersistence } from '@/lib/diagram-persistence';
import type { ExcalidrawScene } from '@/types/diagram';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import '@excalidraw/excalidraw/index.css';

const SAVE_DEBOUNCE_MS = 1000;

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

function buildSceneFromApi(api: ExcalidrawImperativeAPI): ExcalidrawScene {
  return {
    type: 'excalidraw',
    version: 2,
    elements: api.getSceneElements(),
    appState: api.getAppState(),
    files: api.getFiles(),
  };
}

type ForgeCanvasProps = {
  initialElements: ExcalidrawElement[];
  restoredScene?: ExcalidrawScene | null;
  onSceneChange?: (scene: ExcalidrawScene) => void;
  onSelectionChange?: (selectionText: string) => void;
};

export default function ForgeCanvas({
  initialElements,
  restoredScene,
  onSceneChange,
  onSelectionChange,
}: ForgeCanvasProps) {
  const forgeRef = useForgeCanvasRef();
  const { resolvedTheme } = useTheme();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const hasHydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSceneRef = useRef<ExcalidrawScene | null>(null);
  const onSceneChangeRef = useRef(onSceneChange);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onSceneChangeRef.current = onSceneChange;
  }, [onSceneChange]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  const [initialData] = useState<ExcalidrawInitialDataState | undefined>(() => {
    if (restoredScene && countActiveElements(restoredScene.elements) > 0) {
      return {
        elements: restoredScene.elements,
        appState: restoredScene.appState,
        files: restoredScene.files,
      };
    }
    if (initialElements.length > 0) {
      return {
        elements: initialElements,
        appState: { viewBackgroundColor: '#f8fafc' },
        files: {},
      };
    }
    return {
      elements: convertToExcalidrawElements([], { regenerateIds: true }),
      appState: { viewBackgroundColor: '#f8fafc' },
      files: {},
    };
  });

  const persistScene = useCallback((scene: ExcalidrawScene) => {
    if (!hasHydratedRef.current && countActiveElements(scene.elements) === 0) return;
    pendingSceneRef.current = scene;
    onSceneChangeRef.current?.(scene);
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (apiRef.current) {
        persistScene(buildSceneFromApi(apiRef.current));
      }
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, [persistScene]);

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      if (countActiveElements(elements) > 0) {
        hasHydratedRef.current = true;
      }
      const selectionText = extractSelectionText(elements, appState.selectedElementIds);
      onSelectionChangeRef.current?.(selectionText);

      const scene: ExcalidrawScene = {
        type: 'excalidraw',
        version: 2,
        elements,
        appState,
        files,
      };
      pendingSceneRef.current = scene;
      scheduleSave();
    },
    [scheduleSave]
  );

  const getScene = useCallback((): ExcalidrawScene | null => {
    if (apiRef.current) return buildSceneFromApi(apiRef.current);
    return pendingSceneRef.current;
  }, []);

  const loadScene = useCallback((scene: ExcalidrawScene) => {
    if (!apiRef.current) return;
    apiRef.current.updateScene({
      elements: scene.elements,
      appState: scene.appState as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
    });
    const fileValues = Object.values(scene.files ?? {});
    if (fileValues.length > 0) {
      apiRef.current.addFiles(fileValues);
    }
    pendingSceneRef.current = scene;
    hasHydratedRef.current = countActiveElements(scene.elements) > 0;
  }, []);

  const activateFrameTransition = useCallback(
    (completedFrameId: string, nextFrameId: string | null) => {
      if (!apiRef.current) return;
      const elements = apiRef.current.getSceneElements();
      const updated = activateNextFrame(elements, completedFrameId, nextFrameId);
      apiRef.current.updateScene({ elements: updated });
      pendingSceneRef.current = buildSceneFromApi(apiRef.current);
      onSceneChangeRef.current?.(pendingSceneRef.current);
    },
    []
  );

  const applyFeedbackAnnotations = useCallback(
    (frameId: string, stepId: string, feedback: ParsedFeedback) => {
      if (!apiRef.current) return;
      const elements = apiRef.current.getSceneElements();
      const updated = mergeFeedbackAnnotations(elements, frameId, stepId, feedback);
      apiRef.current.updateScene({ elements: updated });
      pendingSceneRef.current = buildSceneFromApi(apiRef.current);
      onSceneChangeRef.current?.(pendingSceneRef.current);
    },
    []
  );

  const exportPng = useCallback(async (): Promise<Blob | null> => {
    const scene = getScene();
    if (!scene) return null;
    return exportSceneToPng(scene);
  }, [getScene]);

  useImperativeHandle(
    forgeRef,
    () => ({
      getScene,
      focusFrame: (frameId: string) => {
        if (apiRef.current) focusFrame(apiRef.current, frameId);
      },
      getFrameText: (frameId: string) => {
        const scene = getScene();
        if (!scene) return '';
        return extractFrameText(scene.elements, frameId);
      },
      getSelectionText: () => {
        if (!apiRef.current) return '';
        const elements = apiRef.current.getSceneElements();
        const appState = apiRef.current.getAppState();
        return extractSelectionText(elements, appState.selectedElementIds);
      },
      loadScene,
      activateFrameTransition,
      applyFeedbackAnnotations,
      exportPng,
    }),
    [getScene, loadScene, activateFrameTransition, applyFeedbackAnnotations, exportPng]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        const scene = apiRef.current ? buildSceneFromApi(apiRef.current) : pendingSceneRef.current;
        if (scene) {
          onSceneChangeRef.current?.(
            stripFilesForPersistence({
              ...scene,
              appState: pickPersistedAppState(scene.appState),
            })
          );
        }
      }
    };
  }, []);

  return (
    <div className="h-full w-full" data-testid="forge-canvas">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
        }}
        initialData={initialData}
        onChange={handleChange}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: false,
            toggleTheme: false,
          },
        }}
      />
    </div>
  );
}
