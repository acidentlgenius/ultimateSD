'use client';

import Link from 'next/link';
import { ProblemWithStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Building2, TrendingUp, CheckCircle, Clock, RotateCcw, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProblemTagList } from '@/components/ProblemTagBadge';

interface ProblemCardProps {
  problem: ProblemWithStatus;
  featured?: boolean;
  locked?: boolean;
  index?: number;
  badge?: string;
  onLockedClick?: (problem: ProblemWithStatus) => void;
  onTagClick?: (tagId: string) => void;
}

export default function ProblemCard({ problem, featured, locked, badge, onLockedClick, onTagClick }: ProblemCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30';
      case 'Medium': return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30';
      case 'Hard': return 'bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  const statusInfo = {
    'COMPLETED': { icon: CheckCircle, color: 'text-green-500', text: 'Completed', bg: 'bg-green-500/10 border-green-200' },
    'REVIEW_NEEDED': { icon: RotateCcw, color: 'text-amber-500', text: 'Review Due', bg: 'bg-amber-500/10 border-amber-200' },
    'IN_PROGRESS': { icon: Clock, color: 'text-blue-500', text: 'In Progress', bg: 'bg-blue-500/10 border-blue-200' },
    'NOT_STARTED': null
  };

  const status = problem.status && statusInfo[problem.status] ? statusInfo[problem.status] : null;
  const StatusIcon = status?.icon;

  const cardInner = (
    <Card className={cn(
      "h-full relative overflow-hidden flex flex-col transition-all duration-300",
      "bg-card/80 backdrop-blur-md border border-black/10 dark:border-white/10",
      locked ? "opacity-80 cursor-pointer" : "group-hover:scale-[1.02] group-hover:-translate-y-1",
      featured ? "shadow-glow-sm border-primary/20" : "shadow-sm hover:shadow-glow-sm"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full p-6">
        <CardHeader className="p-0 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {badge && (
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold">
                  {badge}
                </Badge>
              )}
              {locked && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-amber-500/30 text-amber-600">
                  Pro
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border",
                  getDifficultyColor(problem.difficulty)
                )}
              >
                {problem.difficulty}
              </Badge>
            </div>
            {locked && <Lock className="h-4 w-4 text-amber-500/70" />}
          </div>

          <CardTitle className={cn(
            "text-xl font-bold leading-tight tracking-tight text-card-foreground transition-all duration-300",
            !locked && "group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-500"
          )}>
            {problem.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed font-medium">
            {problem.description}
          </p>

          <ProblemTagList
            slug={problem.slug}
            legacyTags={problem.tags}
            limit={4}
            className="mt-2"
            onTagClick={onTagClick}
          />

          {problem.companies.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                {Array.from(new Set(problem.companies)).slice(0, 3).map(c => (
                  <span key={c} className="text-xs font-medium text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between min-h-[1.5rem]">
              <div className="flex items-center gap-2 flex-wrap">
                {status ? (
                  <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full", status.bg, status.color)}>
                    {StatusIcon && <StatusIcon className="h-3 w-3" />}
                    <span>{status.text}</span>
                  </div>
                ) : (
                  <div className="h-6" />
                )}
                {(problem.totalAttempts ?? 0) > 0 && problem.status !== 'COMPLETED' && (
                  <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-none">
                    {problem.totalAttempts} attempt{problem.totalAttempts !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {(problem.progress && problem.progress > 0 && problem.status !== 'COMPLETED') && (
                <div className="flex items-center gap-2 w-24">
                  <Progress value={problem.progress} className="h-1.5 flex-1 bg-secondary/80" />
                  <span className="text-[10px] font-bold text-muted-foreground">{Math.round(problem.progress)}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <TrendingUp className="h-3.5 w-3.5 opacity-70" />
                <span>{problem.category}</span>
              </div>

              <div className={cn(
                "flex items-center gap-1.5 text-sm font-semibold transition-all duration-300",
                locked
                  ? "text-amber-600"
                  : featured
                    ? "text-primary hover:translate-x-1"
                    : "text-muted-foreground group-hover:text-primary group-hover:translate-x-1"
              )}>
                <span>{locked ? 'Unlock' : 'Practice'}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );

  if (locked) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Unlock ${problem.title}`}
        className="block group h-full relative w-full text-left cursor-pointer"
        onClick={() => onLockedClick?.(problem)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onLockedClick?.(problem);
          }
        }}
      >
        <div className={cn(
          "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-40 blur transition-all duration-500"
        )} />
        {cardInner}
      </div>
    );
  }

  return (
    <Link
      href={`/practice/${problem.slug}`}
      aria-label={`Practice ${problem.title}`}
      className="block group h-full relative"
    >
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/30 to-purple-600/30 opacity-0 group-hover:opacity-100 blur transition-all duration-500",
        featured ? "opacity-40" : ""
      )} />
      {cardInner}
    </Link>
  );
}
