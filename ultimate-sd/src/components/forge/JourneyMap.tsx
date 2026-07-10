'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ForgeJourneyStep, SeniorityLevel } from '@/lib/forge/types';
import { FRAME_THEME_COLORS } from '@/lib/forge/types';
import { estimateMinutesRemaining, getJourneyProgress } from '@/lib/forge/forge-journey';

type JourneyMapProps = {
  journey: ForgeJourneyStep[];
  activeStepIndex: number;
  completedStepIds: string[];
  seniority: SeniorityLevel;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onStepSelect: (stepIndex: number) => void;
  onSeniorityChange?: (level: SeniorityLevel) => void;
};

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  senior: 'Senior',
  architect: 'Architect',
};

export function JourneyMap({
  journey,
  activeStepIndex,
  completedStepIds,
  seniority,
  collapsed,
  onToggleCollapse,
  onStepSelect,
  onSeniorityChange,
}: JourneyMapProps) {
  const progress = getJourneyProgress(completedStepIds, journey.length);
  const minutesLeft = estimateMinutesRemaining(journey, activeStepIndex);

  if (collapsed) {
    return (
      <aside className="flex w-12 flex-col items-center border-r bg-card/80 py-4">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Expand journey map">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="mt-4 flex flex-col gap-3">
          {journey.map((step) => {
            const isActive = step.stepIndex === activeStepIndex;
            const isComplete = completedStepIds.includes(step.stepId);
            return (
              <button
                key={step.stepId}
                type="button"
                onClick={() => onStepSelect(step.stepIndex)}
                className={cn(
                  'h-3 w-3 rounded-full border-2 transition-colors',
                  isComplete && 'bg-green-500 border-green-500',
                  isActive && !isComplete && 'border-primary bg-primary',
                  !isActive && !isComplete && 'border-muted-foreground/40'
                )}
                style={isActive ? { borderColor: FRAME_THEME_COLORS[step.theme] } : undefined}
                aria-label={step.title}
              />
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-56 flex-col border-r bg-card/80" data-testid="journey-map">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold">Journey</span>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Collapse journey map">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3 py-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{progress}%</span>
          <span>~{minutesLeft}m left</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {journey.map((step) => {
          const isActive = step.stepIndex === activeStepIndex;
          const isComplete = completedStepIds.includes(step.stepId);
          const color = FRAME_THEME_COLORS[step.theme];

          return (
            <button
              key={step.stepId}
              type="button"
              onClick={() => onStepSelect(step.stepIndex)}
              className={cn(
                'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                isActive && 'bg-accent',
                !isActive && 'hover:bg-muted/60'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                  isComplete && 'border-green-500 bg-green-500 text-white',
                  !isComplete && isActive && 'border-current',
                  !isComplete && !isActive && 'border-muted-foreground/40'
                )}
                style={!isComplete && isActive ? { color, borderColor: color } : undefined}
              >
                {isComplete ? '✓' : step.stepIndex + 1}
              </span>
              <span className={cn('leading-tight', isActive && 'font-medium')}>{step.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t px-3 py-2">
        <label className="mb-1 block text-xs text-muted-foreground">Seniority</label>
        {onSeniorityChange ? (
          <select
            value={seniority}
            onChange={(e) => onSeniorityChange(e.target.value as SeniorityLevel)}
            className="w-full rounded-md border bg-background px-2 py-1 text-xs"
            aria-label="Seniority level"
          >
            {(Object.keys(SENIORITY_LABELS) as SeniorityLevel[]).map((level) => (
              <option key={level} value={level}>
                {SENIORITY_LABELS[level]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-muted-foreground">{SENIORITY_LABELS[seniority]}</span>
        )}
      </div>
    </aside>
  );
}
