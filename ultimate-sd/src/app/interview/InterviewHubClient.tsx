'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InterviewVariantPicker } from '@/components/InterviewVariantPicker';
import { InterviewDebriefCard } from '@/components/InterviewDebriefCard';
import type { InterviewDebriefVariant, StoredInterviewDebrief } from '@/lib/interview-debrief';
import type { SystemDesignProblem } from '@/types';

interface InterviewHubClientProps {
  interviewEntitled: boolean;
  voiceEntitled: boolean;
  problems: SystemDesignProblem[];
  debriefs: StoredInterviewDebrief[];
}

export function InterviewHubClient({
  interviewEntitled,
  voiceEntitled,
  problems,
  debriefs,
}: InterviewHubClientProps) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState(problems[0]?.slug ?? '');
  const [variant, setVariant] = useState<InterviewDebriefVariant>('lite');

  const handleStart = () => {
    if (!selectedSlug || !interviewEntitled) return;
    if (variant === 'voice' && !voiceEntitled) return;
    router.push(`/practice/${selectedSlug}?interview=${variant}`);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Timer className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Interview Hub</h1>
        {!interviewEntitled && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            AI plan
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground mb-10">
        Pick a problem, choose your interview format, and get an AI hiring-committee debrief when time runs out.
      </p>

      <section className="rounded-2xl border border-border/60 bg-card/30 p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">How it works</h2>
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li>Choose a system design problem and a timed format (lite, full, or voice).</li>
          <li>Work through steps under a strict countdown — no help assistant during the interview.</li>
          <li>Receive an AI debrief with score, verdict, strengths, and areas to improve.</li>
        </ol>
      </section>

      <section className="space-y-6 mb-12">
        <div>
          <label htmlFor="problem-select" className="text-sm font-medium mb-2 block">
            Problem
          </label>
          <select
            id="problem-select"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            disabled={!interviewEntitled}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {problems.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Format</label>
          <InterviewVariantPicker
            selected={variant}
            onSelect={setVariant}
            interviewEntitled={interviewEntitled}
            voiceEntitled={voiceEntitled}
            disabled={!interviewEntitled}
          />
        </div>

        {interviewEntitled ? (
          <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
            Start interview
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/pricing?feature=interviewMode">
                <Sparkles className="mr-2 h-4 w-4" />
                See plans
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full text-muted-foreground" asChild>
              <Link href="/">Browse problems</Link>
            </Button>
          </div>
        )}
      </section>

      {interviewEntitled && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Past debriefs</h2>
          {debriefs.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border/60 p-8 text-center">
              Complete your first timed interview to see debriefs here.
            </p>
          ) : (
            <div className="space-y-3">
              {debriefs.map((d) => (
                <InterviewDebriefCard key={d.id} debrief={d} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
