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
import { exportPNG } from '@/lib/exportUtils';
import type { DiagramCanvasProps, ExcalidrawScene } from '@/types/diagram';
import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

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

export default function DiagramCanvas({ stepKey, isVisible = true }: DiagramCanvasProps) {
  const diagramRef = useDiagramCanvasRef();
  const { resolvedTheme } = useTheme();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const isRestoringRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);
  const filesRef = useRef<BinaryFiles>({});

  const getScene = useCallback((): ExcalidrawScene | null => {
    if (!apiRef.current) return null;
    return buildSceneFromApi(apiRef.current);
  }, []);

  const scheduleSave = useCallback(
    (scene: ExcalidrawScene) => {
      if (isRestoringRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveDiagram(stepKey, scene);
      }, 1000);
    },
    [stepKey]
  );

  const restoreScene = useCallback(
    (scene: ExcalidrawScene) => {
      if (!apiRef.current) return;
      isRestoringRef.current = true;
      filesRef.current = scene.files ?? {};
      apiRef.current.updateScene({
        elements: scene.elements,
        appState: scene.appState as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
      });
      const fileValues = Object.values(scene.files ?? {});
      if (fileValues.length > 0) {
        apiRef.current.addFiles(fileValues);
      }
      window.setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    },
    []
  );

  useEffect(() => {
    purgeLegacyDesignKeys();
  }, []);

  useEffect(() => {
    if (!isReady || !apiRef.current) return;
    const persisted = loadDiagram(stepKey);
    if (persisted?.scene) {
      restoreScene(persisted.scene);
    } else {
      isRestoringRef.current = true;
      apiRef.current.resetScene();
      filesRef.current = {};
      window.setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    }
  }, [stepKey, isReady, restoreScene]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

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
        scheduleSave(scene);
      },
      clear: (clearStorage = false) => {
        if (clearStorage) clearDiagram(stepKey);
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
          scheduleSave(scene);
        } catch {
          toast.error('Could not import diagram file. Check the format and try again.');
        }
      },
    }),
    [getScene, isVisible, restoreScene, scheduleSave, stepKey]
  );

  const handleChange = useCallback(
    (elements: ExcalidrawScene['elements'], appState: AppState, files: BinaryFiles) => {
      filesRef.current = files;
      scheduleSave({
        type: 'excalidraw',
        version: 2,
        elements,
        appState,
        files,
      });
    },
    [scheduleSave]
  );

  const excalidrawTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <Card className="flex h-full w-full min-h-0 flex-col overflow-hidden border-0 shadow-none">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <p className="truncate text-xs text-muted-foreground">Draw your system diagram</p>
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
        <Excalidraw
          excalidrawAPI={(api) => {
            apiRef.current = api;
            setIsReady(true);
          }}
          theme={excalidrawTheme}
          onChange={handleChange}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              export: false,
              toggleTheme: false,
            },
          }}
        />
      </div>
    </Card>
  );
}
