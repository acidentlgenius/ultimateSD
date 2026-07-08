'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Download,
  Eraser,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDiagramCanvasRef } from '@/components/diagram/DiagramCanvasContext';
import { buildDiagramDescription } from '@/lib/diagram-description';
import {
  clearDiagram,
  loadDiagram,
  purgeLegacyDesignKeys,
  saveDiagram,
} from '@/lib/diagram-persistence';
import { countActiveElements, diagramDebug } from '@/lib/diagram-debug';
import { exportPNG } from '@/lib/exportUtils';
import type { DiagramCanvasProps, ExcalidrawScene } from '@/types/diagram';
import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const SAVE_DEBOUNCE_MS = 1000;
const RESTORE_GUARD_MS = 300;

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

function sceneToInitialData(scene: ExcalidrawScene): ExcalidrawInitialDataState {
  return {
    elements: scene.elements,
    appState: scene.appState,
    files: scene.files,
  };
}

export default function DiagramCanvas({ stepKey, isVisible = true }: DiagramCanvasProps) {
  const diagramRef = useDiagramCanvasRef();
  const { resolvedTheme } = useTheme();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const isRestoringRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);
  const filesRef = useRef<BinaryFiles>({});
  const pendingSceneRef = useRef<ExcalidrawScene | null>(null);
  const stepKeyRef = useRef(stepKey);
  /**
   * False until the canvas has PROVABLY shown content (an onChange/API read
   * with elements > 0) or there was nothing to restore in the first place.
   * Excalidraw fires empty onChange events during mount, and a restore can
   * fail to materialize — before hydration an empty scene means "not loaded
   * yet" and must never be persisted. After hydration an empty scene is a
   * deliberate delete-all and MUST be persisted — skipping it resurrected
   * deleted diagrams on refresh. Merely *attempting* a restore does not
   * count as hydration; only observed content does.
   */
  const hasHydratedRef = useRef(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const savedBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** undefined = loading, null = empty canvas, object = restore payload */
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null | undefined>(
    undefined
  );
  /** Bumps when persisted payload is resolved so Excalidraw remounts with initialData */
  const [canvasEpoch, setCanvasEpoch] = useState(0);

  stepKeyRef.current = stepKey;

  const beginRestoreGuard = useCallback(() => {
    isRestoringRef.current = true;
    window.setTimeout(() => {
      isRestoringRef.current = false;
    }, RESTORE_GUARD_MS);
  }, []);

  const resolveSceneForPersist = useCallback((): ExcalidrawScene | null => {
    if (apiRef.current) {
      const live = buildSceneFromApi(apiRef.current);
      // NEVER trust a live-empty read: during step navigation the flush runs
      // after the keyed Excalidraw child unmounted, and its dead API reports
      // an empty scene even though the user drew content. Deliberate
      // delete-alls reach persistence via pendingSceneRef, which onChange
      // updates with empty scenes once hydrated.
      if (countActiveElements(live.elements) > 0) return live;
    }
    return pendingSceneRef.current;
  }, []);

  const markSaved = useCallback(() => {
    setSaveState('saved');
    if (savedBadgeTimerRef.current) clearTimeout(savedBadgeTimerRef.current);
    savedBadgeTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
  }, []);

  const persistScene = useCallback((key: string, scene: ExcalidrawScene | null, reason: string) => {
    if (isRestoringRef.current) {
      diagramDebug('persist:skipped-restoring', { stepKey: key, reason });
      return;
    }
    if (!scene || countActiveElements(scene.elements) === 0) {
      if (scene && hasHydratedRef.current) {
        // Deliberate delete-all: persist the emptiness, otherwise the old
        // scene resurrects on refresh (chronic bug).
        pendingSceneRef.current = scene;
        clearDiagram(key);
        diagramDebug('persist:cleared-empty', { stepKey: key, reason });
        markSaved();
        return;
      }
      diagramDebug('persist:skipped-empty', { stepKey: key, reason });
      return;
    }
    pendingSceneRef.current = scene;
    diagramDebug('persist', {
      stepKey: key,
      reason,
      elementCount: countActiveElements(scene.elements),
    });
    saveDiagram(key, scene);
    markSaved();
  }, [markSaved]);

  const persistLiveScene = useCallback(
    (key: string, reason: string) => {
      persistScene(key, resolveSceneForPersist(), reason);
    },
    [persistScene, resolveSceneForPersist]
  );

  const flushSaveForKey = useCallback(
    (key: string, reason: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      persistLiveScene(key, reason);
    },
    [persistLiveScene]
  );

  const scheduleSave = useCallback(() => {
    if (isRestoringRef.current) {
      diagramDebug('schedule:skipped-restoring', { stepKey: stepKeyRef.current });
      return;
    }
    if (hasHydratedRef.current) setSaveState('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const previewCount = apiRef.current
      ? countActiveElements(apiRef.current.getSceneElements())
      : countActiveElements(pendingSceneRef.current?.elements);
    diagramDebug('schedule:debounce', {
      stepKey: stepKeyRef.current,
      elementCount: previewCount,
      debounceMs: SAVE_DEBOUNCE_MS,
    });
    saveTimerRef.current = setTimeout(() => {
      persistLiveScene(stepKeyRef.current, 'debounce-commit');
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, [persistLiveScene]);

  const getScene = useCallback((): ExcalidrawScene | null => {
    if (!apiRef.current) return pendingSceneRef.current;
    return buildSceneFromApi(apiRef.current);
  }, []);

  const restoreScene = useCallback(
    (scene: ExcalidrawScene) => {
      if (!apiRef.current) return;
      beginRestoreGuard();
      filesRef.current = scene.files ?? {};
      apiRef.current.updateScene({
        elements: scene.elements,
        appState: scene.appState as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
      });
      const fileValues = Object.values(scene.files ?? {});
      if (fileValues.length > 0) {
        apiRef.current.addFiles(fileValues);
      }
      pendingSceneRef.current = scene;
      diagramDebug('restore:applied', {
        stepKey: stepKeyRef.current,
        elementCount: countActiveElements(scene.elements),
      });
    },
    [beginRestoreGuard]
  );

  const handleSceneChange = useCallback(
    (elements: ExcalidrawScene['elements'], appState: AppState, files: BinaryFiles) => {
      filesRef.current = files;
      const scene: ExcalidrawScene = {
        type: 'excalidraw',
        version: 2,
        elements,
        appState,
        files,
      };
      if (countActiveElements(elements) > 0) {
        // Observed real content — from here on, emptiness means the user
        // deleted everything, not that loading is incomplete.
        hasHydratedRef.current = true;
        pendingSceneRef.current = scene;
      } else if (hasHydratedRef.current) {
        pendingSceneRef.current = scene;
      }
      diagramDebug('onChange', {
        stepKey: stepKeyRef.current,
        callbackElementCount: countActiveElements(elements),
        liveElementCount: apiRef.current
          ? countActiveElements(apiRef.current.getSceneElements())
          : 0,
        isRestoring: isRestoringRef.current,
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  useEffect(() => {
    purgeLegacyDesignKeys();
  }, []);

  useEffect(() => {
    setIsReady(false);
    apiRef.current = null;
    hasHydratedRef.current = false;
    setSaveState('idle');
    setInitialData(undefined);

    diagramDebug('step:load-initial-data', { stepKey });
    const persisted = loadDiagram(stepKey);
    if (persisted?.scene && countActiveElements(persisted.scene.elements) > 0) {
      pendingSceneRef.current = persisted.scene;
      setInitialData(sceneToInitialData(persisted.scene));
      setCanvasEpoch((epoch) => epoch + 1);
      diagramDebug('step:initial-data-ready', {
        stepKey,
        elementCount: countActiveElements(persisted.scene.elements),
      });
    } else {
      pendingSceneRef.current = null;
      setInitialData(null);
      setCanvasEpoch((epoch) => epoch + 1);
      diagramDebug('step:initial-data-empty', { stepKey });
    }
  }, [stepKey]);

  useEffect(() => {
    const key = stepKey;
    return () => {
      flushSaveForKey(key, 'step-change-or-unmount');
    };
  }, [stepKey, flushSaveForKey]);

  useEffect(() => {
    const onPageHide = () => flushSaveForKey(stepKeyRef.current, 'pagehide');
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (savedBadgeTimerRef.current) {
        clearTimeout(savedBadgeTimerRef.current);
        savedBadgeTimerRef.current = null;
      }
    };
  }, [flushSaveForKey]);

  const bindApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;
      beginRestoreGuard();

      const liveCount = countActiveElements(api.getSceneElements());
      const pending = pendingSceneRef.current;
      const pendingCount = countActiveElements(pending?.elements);
      diagramDebug('api:bound', {
        stepKey: stepKeyRef.current,
        liveElementCount: liveCount,
        pendingElementCount: pendingCount,
      });

      // excalidrawAPI fires before initialData is always hydrated — restore if still empty.
      if (liveCount === 0 && pending && pendingCount > 0) {
        const applyPendingScene = () => {
          if (!apiRef.current) return;
          const afterInitial = countActiveElements(apiRef.current.getSceneElements());
          if (afterInitial > 0) {
            diagramDebug('api:initial-data-applied', {
              stepKey: stepKeyRef.current,
              liveElementCount: afterInitial,
            });
            hasHydratedRef.current = true;
            return;
          }
          if (pendingSceneRef.current && countActiveElements(pendingSceneRef.current.elements) > 0) {
            // Restore attempted — hydration is confirmed only when the
            // restored content is observed (handleSceneChange / API reads),
            // so a silently-failed restore can never wipe the saved scene.
            restoreScene(pendingSceneRef.current);
          }
        };
        requestAnimationFrame(() => requestAnimationFrame(applyPendingScene));
      } else if (liveCount > 0 || !pending || pendingCount === 0) {
        // Content already visible, or nothing to restore — canvas is truth.
        hasHydratedRef.current = true;
      }

      setIsReady(true);
    },
    [beginRestoreGuard, restoreScene]
  );

  useImperativeHandle(
    diagramRef,
    () => ({
      getApi: () => apiRef.current,
      getScene,
      getDescription: () => {
        const scene = getScene();
        if (!scene) return null;
        return buildDiagramDescription(scene.elements);
      },
      getPng: async () => {
        if (!isVisible) return null;
        const scene = getScene();
        if (!scene) return null;
        const elements = scene.elements.filter((el) => !el.isDeleted);
        if (elements.length === 0) return null;
        const { exportToBlob } = await import('@excalidraw/excalidraw');
        return exportToBlob({
          elements,
          appState: scene.appState,
          files: scene.files,
          mimeType: 'image/png',
        });
      },
      loadScene: (scene: ExcalidrawScene) => {
        restoreScene(scene);
        scheduleSave();
      },
      clear: (clearStorage = false) => {
        if (clearStorage) clearDiagram(stepKey);
        pendingSceneRef.current = null;
        apiRef.current?.resetScene();
        filesRef.current = {};
      },
      exportExcalidrawFile: async () => {
        const scene = getScene();
        if (!scene) return;
        const { serializeAsJSON } = await import('@excalidraw/excalidraw');
        const json = serializeAsJSON(scene.elements, scene.appState, scene.files, 'local');
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram-${stepKey}.excalidraw`;
        a.click();
        URL.revokeObjectURL(url);
      },
      importExcalidrawFile: async (file: File) => {
        try {
          const { loadFromBlob } = await import('@excalidraw/excalidraw');
          const restored = await loadFromBlob(
            file,
            apiRef.current?.getAppState() ?? null,
            apiRef.current?.getSceneElements() ?? null
          );
          const scene: ExcalidrawScene = {
            type: 'excalidraw',
            version: 2,
            elements: restored.elements,
            appState: restored.appState,
            files: restored.files ?? {},
          };
          restoreScene(scene);
          scheduleSave();
        } catch {
          toast.error('Could not import diagram file. Check the format and try again.');
        }
      },
    }),
    [getScene, isVisible, restoreScene, scheduleSave, stepKey]
  );

  const excalidrawTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const canMountCanvas = initialData !== undefined && resolvedTheme !== undefined;

  return (
    <Card className="flex h-full w-full min-h-0 flex-col overflow-hidden border-0 shadow-none">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="truncate text-xs text-muted-foreground">Draw your system diagram</p>
          {saveState !== 'idle' && (
            <span
              className={`shrink-0 text-[10px] font-medium ${saveState === 'saved' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
              data-testid="diagram-save-state"
              role="status"
            >
              {saveState === 'saved' ? 'Saved ✓' : 'Saving…'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".excalidraw,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await diagramRef.current?.importExcalidrawFile(file);
              e.target.value = '';
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 h-3 w-3" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => diagramRef.current?.exportExcalidrawFile()}
          >
            <Download className="mr-1 h-3 w-3" /> .excalidraw
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() =>
              exportPNG({
                getPngBlob: () => diagramRef.current?.getPng() ?? Promise.resolve(null),
              })
            }
          >
            <ImageIcon className="mr-1 h-3 w-3" /> PNG
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => diagramRef.current?.clear(true)}
          >
            <Eraser className="mr-1 h-3 w-3" /> Clear
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {canMountCanvas ? (
          <Excalidraw
            key={`${stepKey}-${canvasEpoch}`}
            excalidrawAPI={bindApi}
            initialData={initialData ?? undefined}
            onChange={handleSceneChange}
            theme={excalidrawTheme}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
                export: false,
                toggleTheme: false,
              },
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading canvas…
          </div>
        )}
      </div>
    </Card>
  );
}
