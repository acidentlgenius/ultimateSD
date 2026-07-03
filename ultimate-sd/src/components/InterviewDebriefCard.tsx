'use client';

import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDebriefVariant, type StoredInterviewDebrief } from '@/lib/interview-debrief';

interface InterviewDebriefCardProps {
  debrief: StoredInterviewDebrief;
}

export function InterviewDebriefCard({ debrief }: InterviewDebriefCardProps) {
  const dateLabel = debrief.createdAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/practice/${debrief.problemSlug}`}
      className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/50 p-4 hover:bg-muted/40 transition-colors"
    >
      <div className="min-w-0 space-y-1">
        <p className="font-medium truncate">{debrief.problemTitle}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {dateLabel}
          </span>
          <Badge variant="outline">{formatDebriefVariant(debrief.variant)}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{debrief.overallScore}/10</p>
          <p className="text-xs text-muted-foreground">{debrief.verdict}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}
