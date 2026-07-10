'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ForgeJourneyStep } from '@/lib/forge/types';
import { FRAME_THEME_COLORS } from '@/lib/forge/types';

type GuidancePanelProps = {
  step: ForgeJourneyStep | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onReviewStep: () => void;
  isReviewing: boolean;
};

export function GuidancePanel({
  step,
  collapsed,
  onToggleCollapse,
  onReviewStep,
  isReviewing,
}: GuidancePanelProps) {
  if (collapsed) {
    return (
      <aside className="flex w-10 flex-col items-center border-l bg-card/80 py-4">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Expand guidance panel">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  if (!step) return null;

  const color = FRAME_THEME_COLORS[step.theme];

  return (
    <aside className="flex w-72 flex-col border-l bg-card/80" data-testid="guidance-panel">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold">Guidance</span>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Collapse guidance panel">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="mb-1 text-xs font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          Step {step.stepIndex + 1}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          ⏱ {step.idealMinutes[0]}–{step.idealMinutes[1]} min ideal
        </p>

        <p className="mb-4 text-sm text-muted-foreground">{step.prompt}</p>

        <section className="mb-4">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Objectives</h4>
          <ul className="space-y-1">
            {step.objectives.map((obj) => (
              <li key={obj} className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                {obj}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Pitfalls</h4>
          <ul className="space-y-1">
            {step.pitfalls.map((pitfall) => (
              <li key={pitfall} className="flex gap-2 text-sm text-muted-foreground">
                <span>△</span>
                {pitfall}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="border-t p-3">
        <Button
          className="w-full"
          onClick={onReviewStep}
          disabled={isReviewing}
          data-testid="forge-review-step"
        >
          {isReviewing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reviewing…
            </>
          ) : (
            'Review this step'
          )}
        </Button>
      </div>
    </aside>
  );
}
