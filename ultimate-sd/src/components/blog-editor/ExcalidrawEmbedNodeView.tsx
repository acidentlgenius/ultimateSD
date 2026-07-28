'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { PencilRuler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcalidrawEmbedModal } from './ExcalidrawEmbedModal';
import type { ExcalidrawScene } from '@/types/diagram';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

function ReadOnlyScene({ scene }: { scene: ExcalidrawScene }) {
  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border">
      <Excalidraw
        initialData={{
          elements: scene.elements,
          appState: { ...scene.appState, viewModeEnabled: true },
          files: scene.files,
        }}
        viewModeEnabled
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
  );
}

export function ExcalidrawEmbedNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scene = node.attrs.scene as ExcalidrawScene | null;

  if (!editor.isEditable) {
    return <NodeViewWrapper data-type="excalidraw-embed">{scene && <ReadOnlyScene scene={scene} />}</NodeViewWrapper>;
  }

  return (
    <NodeViewWrapper data-type="excalidraw-embed">
      <div className="my-4 rounded-xl border border-dashed p-4" contentEditable={false}>
        {scene ? (
          <div className="pointer-events-none h-[300px] w-full overflow-hidden rounded-lg border">
            <ReadOnlyScene scene={scene} />
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">No diagram yet.</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setIsModalOpen(true)}
        >
          <PencilRuler className="mr-2 h-4 w-4" />
          {scene ? 'Edit diagram' : 'Create diagram'}
        </Button>
      </div>
      <ExcalidrawEmbedModal
        open={isModalOpen}
        initialScene={scene}
        onOpenChange={setIsModalOpen}
        onSave={(newScene) => {
          updateAttributes({ scene: newScene });
          setIsModalOpen(false);
        }}
      />
    </NodeViewWrapper>
  );
}
