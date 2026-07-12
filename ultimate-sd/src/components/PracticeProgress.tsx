'use client';

import { cn } from '@/lib/utils';

export function PracticeProgress({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 px-1">
        <span>Progress</span>
        <span className="tabular-nums font-medium">
          {current} of {total}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/80 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
