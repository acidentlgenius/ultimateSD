import { ImageIcon } from "lucide-react";
import { DiagramBlock } from "@/lib/blog";

export function ArchitectureDiagram({ block }: { block: DiagramBlock }) {
  return (
    <div className="my-8 rounded-lg border bg-card p-2 shadow-sm">
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 text-muted-foreground">
        <ImageIcon className="mb-4 h-12 w-12 opacity-50" />
        <p className="font-medium">Diagram: {block.diagramId}</p>
        <p className="text-sm opacity-70">Architecture visualization placeholder</p>
      </div>
      {block.title && (
        <div className="mt-3 text-center text-sm font-medium text-muted-foreground">
          {block.title}
        </div>
      )}
      {block.description && (
        <div className="mt-1 text-center text-xs text-muted-foreground/80">
          {block.description}
        </div>
      )}
    </div>
  );
}
