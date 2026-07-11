'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ListChecks, PenTool, Table2 } from 'lucide-react';
import { isDiagramSubStep } from '@/lib/step-journey';
import { captureClientEvent } from '@/lib/analytics-client';
import type { ProblemIntroContent, StepData, SystemDesignProblem } from '@/types';

const INPUT_TYPE_ICONS = {
  list: ListChecks,
  textarea: FileText,
  schema: Table2,
} as const;

function StepIcon({ step }: { step: StepData }) {
  const Icon = isDiagramSubStep(step.subStep) ? PenTool : INPUT_TYPE_ICONS[step.inputType];
  return <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export function ProblemIntroOverlay({
  problem,
  steps,
  intro,
  open,
  onOpenChange,
}: {
  problem: SystemDesignProblem;
  steps: Record<string, StepData[]>;
  intro: ProblemIntroContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (open) {
      captureClientEvent('problem intro viewed', {
        slug: problem.slug,
        source: intro.source,
      });
    }
  }, [open, problem.slug, intro.source]);

  const phases = Object.entries(steps).filter(([, phaseSteps]) => phaseSteps.length > 0);
  const totalSteps = phases.reduce((n, [, phaseSteps]) => n + phaseSteps.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="problem-intro-overlay"
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{problem.difficulty}</Badge>
            <Badge variant="outline">{problem.category}</Badge>
          </div>
          <DialogTitle className="text-2xl">{problem.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Problem brief: scenario, session journey, and key concepts.
          </DialogDescription>
        </DialogHeader>

        {/* The scenario */}
        <section className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">
            The scenario
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{intro.hook}</p>
        </section>

        {/* Your journey */}
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">
            Your journey — {totalSteps} steps
          </h4>
          <div className="space-y-3">
            {phases.map(([phaseKey, phaseSteps], phaseIndex) => (
              <div key={phaseKey} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-sm font-semibold">
                  {phaseIndex + 1}. {phaseSteps[0].phase}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {phaseSteps.map((step, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StepIcon step={step} />
                      <span className="truncate">{step.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Key concepts — hidden when empty */}
        {intro.concepts.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">
              Key concepts
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {intro.concepts.map((concept) => (
                <div key={concept.term} className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-semibold">{concept.term}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {concept.blurb}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Button className="w-full" size="lg" onClick={() => onOpenChange(false)}>
          Start solving
        </Button>
      </DialogContent>
    </Dialog>
  );
}
