'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ExcalidrawScene } from '@/types/diagram';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface ExcalidrawEmbedModalProps {
  open: boolean;
  initialScene: ExcalidrawScene | null;
  onOpenChange: (open: boolean) => void;
  onSave: (scene: ExcalidrawScene) => void;
}

export function ExcalidrawEmbedModal({
  open,
  initialScene,
  onOpenChange,
  onSave,
}: ExcalidrawEmbedModalProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const handleSave = () => {
    const api = apiRef.current;
    if (!api) return;
    // Drop collaborators — it's a Map in Excalidraw's live state, which JSON
    // persistence can't round-trip (JSON.stringify(new Map()) === '{}').
    const { collaborators: _collaborators, ...appState } = api.getAppState();
    onSave({
      type: 'excalidraw',
      version: 2,
      elements: api.getSceneElements(),
      appState,
      files: api.getFiles(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Diagram</DialogTitle>
          <DialogDescription className="sr-only">Create or edit a diagram using Excalidraw</DialogDescription>
        </DialogHeader>
        <div className="h-[500px] w-full overflow-hidden rounded-lg border">
          {open && (
            <Excalidraw
              excalidrawAPI={(api) => {
                apiRef.current = api;
              }}
              initialData={
                initialScene
                  ? {
                      elements: initialScene.elements,
                      // Reset collaborators for the same reason as ReadOnlyScene —
                      // persisted scenes never have a real Map here.
                      appState: { ...initialScene.appState, collaborators: new Map() },
                      files: initialScene.files,
                    }
                  : undefined
              }
            />
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save diagram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
