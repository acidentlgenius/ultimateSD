import { cn } from "@/lib/utils";
import { UserCheck } from "lucide-react";
import { InterviewNoteBlock } from "@/lib/blog";

export function InterviewNote({ block }: { block: InterviewNoteBlock }) {
  return (
    <div className="my-8 overflow-hidden rounded-lg border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">
        <UserCheck className="h-4 w-4" />
        {block.title || "Interviewer's Note"}
      </div>
      <div className="p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
        {block.content}
      </div>
    </div>
  );
}
