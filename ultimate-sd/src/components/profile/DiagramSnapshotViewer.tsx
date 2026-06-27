"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface DiagramSnapshot {
    imageData?: string;
    elements?: unknown[];
    description?: string;
}

interface DiagramSnapshotViewerProps {
    snapshot?: unknown;
}

function parseSnapshot(snapshot: unknown): DiagramSnapshot | null {
    if (!snapshot || typeof snapshot !== "object") return null;
    return snapshot as DiagramSnapshot;
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
