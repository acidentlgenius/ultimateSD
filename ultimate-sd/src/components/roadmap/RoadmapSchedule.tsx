'use client';

import Link from 'next/link';
import { PROBLEMS } from '@/lib/problems';
import {
  getScheduleForTrack,
  getWeekScheduleStatus,
  type ScheduleWeek,
} from '@/lib/roadmap-schedule';
import type { RoadmapTrack } from '@/components/roadmap/RoadmapTypes';
import type { ProgressStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoadmapScheduleProps {
  track: RoadmapTrack;
  progressBySlug: Record<string, ProgressStatus>;
}

function WeekStatusIcon({ status }: { status: ReturnType<typeof getWeekScheduleStatus> }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    case 'in-progress':
      return <Clock className="h-4 w-4 text-blue-500 shrink-0" />;
    case 'upcoming':
      return <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function WeekCard({
  week,
  progressBySlug,
}: {
  week: ScheduleWeek;
  progressBySlug: Record<string, ProgressStatus>;
}) {
  const status = getWeekScheduleStatus(week, progressBySlug);
  const problems = week.slugs
    .map((slug) => PROBLEMS.find((p) => p.slug === slug))
    .filter(Boolean);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 bg-card/40 backdrop-blur-sm transition-colors',
        status === 'complete' && 'border-green-500/30 bg-green-500/5',
        status === 'in-progress' && 'border-blue-500/30 bg-blue-500/5',
        status === 'upcoming' && 'border-border/50',
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <WeekStatusIcon status={status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Week {week.week}
            </span>
            {status === 'complete' && (
              <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600">
                Done
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm mt-0.5">{week.title}</h3>
          <p className="text-xs text-muted-foreground">{week.focus}</p>
        </div>
      </div>
      <ul className="space-y-1 mt-3">
        {problems.map((problem) => {
          if (!problem) return null;
          const slugStatus = progressBySlug[problem.slug];
          const done =
            slugStatus === 'COMPLETED' || slugStatus === 'REVIEW_NEEDED';
          return (
            <li key={problem.slug}>
              <Link
                href={`/practice/${problem.slug}`}
                className={cn(
                  'text-xs hover:text-primary transition-colors flex items-center gap-1.5',
                  done ? 'text-muted-foreground line-through' : 'text-foreground',
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                )}
                {problem.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RoadmapSchedule({ track, progressBySlug }: RoadmapScheduleProps) {
  const schedule = getScheduleForTrack(track);
  if (schedule.length === 0) return null;

  const completedWeeks = schedule.filter(
    (w) => getWeekScheduleStatus(w, progressBySlug) === 'complete',
  ).length;

  return (
    <div className="mb-16 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">8-week study schedule</h2>
              <p className="text-sm text-muted-foreground">
                ~4–6 hours per week · {completedWeeks}/{schedule.length} weeks complete
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {schedule.map((week) => (
            <WeekCard key={week.week} week={week} progressBySlug={progressBySlug} />
          ))}
        </div>
      </div>
    </div>
  );
}
