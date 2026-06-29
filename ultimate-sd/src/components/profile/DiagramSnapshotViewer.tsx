"use client";

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import type { DiagramSnapshot, ExcalidrawScene } from '@/types/diagram';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface DiagramSnapshotViewerProps {
    snapshot?: unknown;
}

function parseSnapshot(snapshot: unknown): DiagramSnapshot | null {
    if (!snapshot || typeof snapshot !== "object") return null;
    const parsed = snapshot as DiagramSnapshot & { elements?: unknown[] };
    if (parsed.scene || parsed.imageData || parsed.elements) return parsed;
    return null;
}

function isExcalidrawScene(value: unknown): value is ExcalidrawScene {
    return (
        !!value &&
        typeof value === 'object' &&
        (value as ExcalidrawScene).type === 'excalidraw' &&
        Array.isArray((value as ExcalidrawScene).elements)
    );
}

export function DiagramSnapshotViewer({ snapshot }: DiagramSnapshotViewerProps) {
    const parsed = parseSnapshot(snapshot);

    if (!parsed) {
        return (
            <Card className="glass-card border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Diagram</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-xl bg-muted/20">
                        <ImageIcon className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm">No diagram saved for this session.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (parsed.imageData) {
        return (
            <Card className="glass-card border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Diagram</CardTitle>
                    {parsed.description && (
                        <p className="text-sm text-muted-foreground">{parsed.description}</p>
                    )}
                </CardHeader>
                <CardContent>
                    <img
                        src={parsed.imageData}
                        alt="Session diagram snapshot"
                        className="w-full rounded-xl border border-border/50 bg-background"
                    />
                </CardContent>
            </Card>
        );
    }

    if (parsed.scene && isExcalidrawScene(parsed.scene)) {
        return (
            <Card className="glass-card border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Diagram</CardTitle>
                    {parsed.description && (
                        <p className="text-sm text-muted-foreground">{parsed.description}</p>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full rounded-xl border border-border/50 overflow-hidden">
                        <Excalidraw
                            initialData={{
                                elements: parsed.scene.elements,
                                appState: { ...parsed.scene.appState, viewModeEnabled: true },
                                files: parsed.scene.files,
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
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Diagram Data</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="text-xs font-mono bg-muted/30 p-4 rounded-xl overflow-auto max-h-64 border border-border/40">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
}
