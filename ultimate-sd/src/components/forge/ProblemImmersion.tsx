'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SystemDesignProblem } from '@/types';
import type { SeniorityLevel } from '@/lib/forge/types';
import { getForgeProblemContent } from '@/lib/forge/forge-problem-content';
import { cn } from '@/lib/utils';

type ProblemImmersionProps = {
  problem: SystemDesignProblem;
  seniority: SeniorityLevel;
  onSeniorityChange: (level: SeniorityLevel) => void;
  onStart: () => void;
};

const SENIORITY_OPTIONS: { value: SeniorityLevel; label: string; emoji: string; hint: string }[] = [
  { value: 'beginner', label: 'Beginner', emoji: '🌱', hint: '3 starter FRs, heavy guidance' },
  { value: 'intermediate', label: 'Intermediate', emoji: '🌿', hint: '4–5 starters, balanced' },
  { value: 'advanced', label: 'Advanced', emoji: '🌳', hint: '2 seeds, light prompts' },
  { value: 'senior', label: 'Senior', emoji: '🏛', hint: 'Minimal scaffolding' },
  { value: 'architect', label: 'Architect', emoji: '⚡', hint: 'Open-ended, strict review' },
];

function estimateMinutes(difficulty: SystemDesignProblem['difficulty']): string {
  switch (difficulty) {
    case 'Easy':
      return '30–45 min';
    case 'Medium':
      return '45–60 min';
    case 'Hard':
      return '60–75 min';
    default:
      return '45–60 min';
  }
}

export function ProblemImmersion({
  problem,
  seniority,
  onSeniorityChange,
  onStart,
}: ProblemImmersionProps) {
  const forgeContent = getForgeProblemContent(problem.slug);
  const statPills = [
    forgeContent?.immersionHighlight ?? problem.functionalRequirements[0]?.slice(0, 40) ?? 'Core features',
    problem.nonFunctionalRequirements[0]?.slice(0, 40) ?? 'Scale targets',
    `${problem.difficulty} difficulty`,
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="problem-immersion">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/problems"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to problems
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Seniority:</span>
            <select
              value={seniority}
              onChange={(e) => onSeniorityChange(e.target.value as SeniorityLevel)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
              aria-label="Seniority level"
            >
              {SENIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 animate-fade-in">
        <div className="glass-card rounded-2xl border p-8">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>
          </div>

          <p className="mb-8 text-lg text-muted-foreground leading-relaxed">{problem.context}</p>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              What good looks like
            </h2>
            <ul className="space-y-2">
              {problem.functionalRequirements.slice(0, 3).map((fr) => (
                <li key={fr} className="flex gap-2 text-sm">
                  <span className="text-green-500">✓</span>
                  {fr}
                </li>
              ))}
            </ul>
          </section>

          <div className="mb-8 flex flex-wrap gap-3">
            {statPills.map((pill) => (
              <Badge key={pill} variant="secondary" className="px-3 py-1">
                {pill}
              </Badge>
            ))}
          </div>

          {problem.companies.length > 0 && (
            <p className="mb-8 text-sm text-muted-foreground">
              Asked at: {problem.companies.join(' · ')}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            size="lg"
            className={cn(
              'h-14 px-10 text-lg font-semibold',
              'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            )}
            onClick={onStart}
            data-testid="start-designing"
          >
            Start Designing →
          </Button>
          <p className="text-sm text-muted-foreground">
            Est. {estimateMinutes(problem.difficulty)} · canvas-first session
          </p>
        </div>
      </main>
    </div>
  );
}
