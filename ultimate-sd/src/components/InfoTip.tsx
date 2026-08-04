'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InfoTip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className={cn('group/tip relative inline-flex align-middle', className)}>
      <button
        type="button"
        className="inline-flex text-muted-foreground/70 hover:text-primary transition-colors"
        aria-label="More info"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className={cn(
          'absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-2 text-xs leading-relaxed text-popover-foreground shadow-md',
          open ? 'opacity-100' : 'opacity-0 group-hover/tip:opacity-100',
          'transition-opacity pointer-events-none'
        )}
      >
        {text}
      </span>
    </span>
  );
}
