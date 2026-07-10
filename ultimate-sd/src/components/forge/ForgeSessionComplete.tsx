'use client';

import Link from 'next/link';
import { Trophy, ArrowRight, Home, Download, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SystemDesignProblem } from '@/types';
import type { ForgeJourneyStep } from '@/lib/forge/types';
import { getNextProblem } from '@/lib/start-here';
import { STANDARD_FORGE_FRAME_COUNT } from '@/lib/forge/standard-journey';

type ForgeSessionCompleteProps = {
  problem: SystemDesignProblem;
  journey: ForgeJourneyStep[];
  stepScores: Record<string, number>;
  onReviewCanvas: () => void;
  onExportPng: () => void;
};

export function ForgeSessionComplete({
  problem,
  journey,
  stepScores,
  onReviewCanvas,
  onExportPng,
}: ForgeSessionCompleteProps) {
  const scores = journey
    .map((step) => stepScores[step.stepId])
    .filter((s): s is number => typeof s === 'number');
  const overallScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

  const nextProblem = getNextProblem(problem.slug);

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 animate-fade-in"
      data-testid="forge-session-complete"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 scale-150 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="relative rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 p-4 shadow-xl shadow-amber-500/20">
          <Trophy className="h-16 w-16 text-white" />
        </div>
      </div>

      <h2 className="mb-2 text-center text-3xl font-bold">Architecture complete</h2>
      <p className="mb-6 max-w-md text-center text-muted-foreground">
        You finished all {STANDARD_FORGE_FRAME_COUNT} canvas sections for{' '}
        <strong>{problem.title}</strong>.
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm">
        {overallScore !== null && (
          <Badge variant="secondary" className="px-3 py-1 text-base">
            Overall score: {overallScore} / 5
          </Badge>
        )}
        <Badge variant="outline" className="px-3 py-1 text-base">
          Steps: {journey.length}/{journey.length}
        </Badge>
      </div>

      <Card className="glass mb-8 w-full max-w-2xl border-primary/20">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Layout className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Your canvas is saved</h3>
            <p className="text-sm text-muted-foreground">
              Full-session diagram backed up locally and to your practice session.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onExportPng} className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Export PNG
          </Button>
        </CardContent>
      </Card>

      {nextProblem && (
        <Card className="glass mb-8 w-full max-w-2xl border-primary/30">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next problem</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{nextProblem.title}</span>
                <Badge variant="secondary">{nextProblem.difficulty}</Badge>
              </div>
            </div>
            <Button asChild size="lg" className="gap-2 shrink-0">
              <Link href={`/practice/${nextProblem.slug}?canvas=forge`}>
                Continue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Button onClick={onReviewCanvas} className="flex-1 gap-2" size="lg">
          Review canvas
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1 gap-2">
          <Link href="/problems">
            <Home className="h-4 w-4" />
            All problems
          </Link>
        </Button>
      </div>
    </div>
  );
}
