import { Plus, Minus, Scale } from "lucide-react";
import { TradeoffBlock } from "@/lib/blog";

export function TradeoffCard({ block }: { block: TradeoffBlock }) {
  return (
    <div className="my-8 rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <Scale className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-semibold leading-none tracking-tight">
          Tradeoff: {block.title}
        </h4>
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="p-4 sm:border-r">
          <div className="mb-3 flex items-center gap-2 font-medium text-green-600 dark:text-green-500">
            <Plus className="h-4 w-4" />
            Pros
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {block.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t p-4 sm:border-t-0">
          <div className="mb-3 flex items-center gap-2 font-medium text-red-600 dark:text-red-500">
            <Minus className="h-4 w-4" />
            Cons
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {block.cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
