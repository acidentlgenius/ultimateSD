"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { QuizBlock } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuizCard({ block }: { block: QuizBlock }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isCorrect = selected === block.correctAnswerIndex;

  const handleSelect = (index: number) => {
    if (selected !== null) return; // Prevent changing answer after selection
    setSelected(index);
    setShowExplanation(true);
  };

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-6 py-4 border-b flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <h4 className="font-semibold text-lg leading-tight">{block.question}</h4>
      </div>

      <div className="p-6 space-y-3">
        {block.options.map((option, index) => {
          const isSelected = selected === index;
          const isActuallyCorrect = index === block.correctAnswerIndex;

          let stateClass = "hover:border-primary/50 hover:bg-muted/50 cursor-pointer";
          let Icon = null;

          if (selected !== null) {
            stateClass = "opacity-70 cursor-default";
            if (isActuallyCorrect) {
              stateClass = "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900 ring-1 ring-green-500 opacity-100";
              Icon = CheckCircle2;
            } else if (isSelected) {
              stateClass = "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900 opacity-100";
              Icon = XCircle;
            }
          }

          return (
            <button
              type="button"
              disabled={selected !== null}
              key={index}
              onClick={() => handleSelect(index)}
              className={cn(
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between group",
                stateClass
              )}
            >
              <span className={cn("text-sm font-medium", isSelected && !isActuallyCorrect ? "text-red-700 dark:text-red-300" : isActuallyCorrect && selected !== null ? "text-green-700 dark:text-green-300" : "")}>
                {option}
              </span>
              {Icon && (
                <Icon className={cn(
                  "w-5 h-5 shrink-0 ml-4",
                  isActuallyCorrect ? "text-green-500" : "text-red-500"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className={cn(
          "px-6 py-4 border-t text-sm leading-relaxed",
          isCorrect ? "bg-green-50/50 dark:bg-green-950/10 text-green-800 dark:text-green-300" : "bg-muted/50 text-muted-foreground"
        )}>
          <span className="font-semibold mr-2">{isCorrect ? "Correct!" : "Incorrect."}</span>
          {block.explanation}
        </div>
      )}
    </div>
  );
}
