'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { Card } from '@/components/ui/card';
import { captureClientEvent } from '@/lib/analytics-client';
import { cn } from '@/lib/utils';
import type { ProblemIntroContent, SystemDesignProblem } from '@/types';
import { ArrowRight, BookOpen, Lightbulb } from 'lucide-react';
import { useEffect } from 'react';

const PRACTICE_TIPS = [
  'Work one step at a time — later steps unlock as you progress.',
  'Stuck? Tap the purple help button (bottom-right) for hints.',
  'Hover the header title to see how long you have been practicing.',
  'Use ← → arrow keys or the header arrows to move between steps.',
];

function PracticeHelpBulb() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative group/bulb shrink-0">
      <button
        type="button"
        aria-label="How to practice"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          open || 'group-hover/bulb:bg-sky-500/10',
          'text-sky-600 dark:text-sky-400 hover:bg-sky-500/10'
        )}
      >
        <Lightbulb className="h-5 w-5" />
      </button>
      <div
        role="tooltip"
        data-testid="how-to-practice-tip"
        className={cn(
          'absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-popover p-4 shadow-lg',
          'transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 group-hover/bulb:opacity-100',
          !open && 'pointer-events-none group-hover/bulb:pointer-events-auto'
        )}
      >
        <p className="text-sm font-semibold text-foreground mb-2">How to practice</p>
        <ul className="text-xs leading-relaxed text-muted-foreground space-y-2 list-none">
          {PRACTICE_TIPS.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-sky-500 shrink-0">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ProblemIntroStep({
  problem,
  intro,
  onBegin,
}: {
  problem: SystemDesignProblem;
  intro: ProblemIntroContent;
  onBegin: () => void;
}) {
  useEffect(() => {
    captureClientEvent('problem intro viewed', {
      slug: problem.slug,
      source: intro.source,
    });
  }, [problem.slug, intro.source]);

  return (
    <div className="w-full space-y-5 animate-fade-in" data-testid="problem-intro-step">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          Step 1 — Read the brief
        </div>
        <Badge variant="outline">{problem.difficulty}</Badge>
        <Badge variant="outline">{problem.category}</Badge>
      </div>

      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <div className="flex items-start justify-end px-4 pt-4 md:px-6 md:pt-5">
          <PracticeHelpBulb />
        </div>

        <div className="px-5 md:px-8 pb-6 md:pb-8 space-y-8 -mt-2">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              The scenario
            </h3>
            <div className="text-base md:text-lg leading-[1.8] text-foreground/95 whitespace-pre-wrap">
              {intro.hook}
            </div>
          </section>

          {(problem.functionalRequirements?.length ?? 0) > 0 && (
            <section className="space-y-3 pt-2 border-t border-border/60">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What you&apos;ll design for
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  The end goal — you&apos;ll tackle these piece by piece in later steps.
                </p>
              </div>
              <ul className="text-sm md:text-base text-foreground/85 space-y-2 list-disc pl-5 marker:text-primary/60">
                {problem.functionalRequirements!.map((req) => (
                  <li key={req} className="leading-relaxed">
                    {req}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {intro.concepts.length > 0 && (
            <section className="space-y-3 pt-2 border-t border-border/60">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Key concepts
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Terms you may hear in the interview — read each one before you start.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {intro.concepts.map((concept) => (
                  <div
                    key={concept.term}
                    className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-foreground">{concept.term}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {concept.blurb}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </Card>

      <Button className="w-full gradient-bg h-12 text-base sticky bottom-4 z-10" size="lg" onClick={onBegin}>
        I&apos;m ready — let&apos;s start
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
