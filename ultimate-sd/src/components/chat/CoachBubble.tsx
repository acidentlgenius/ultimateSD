'use client';

import { cn } from '@/lib/utils';

export type CoachBubbleRole = 'system' | 'you' | 'coach' | 'user' | 'assistant';

export function CoachBubble({
  role,
  children,
  className,
  label,
}: {
  role: CoachBubbleRole;
  children: React.ReactNode;
  className?: string;
  /** Override default You / Coach label */
  label?: string;
}) {
  if (role === 'system') {
    return (
      <p className={cn('text-center text-xs text-muted-foreground tracking-wide py-1', className)}>
        {children}
      </p>
    );
  }

  const isYou = role === 'you' || role === 'user';
  const labelText = label ?? (isYou ? 'You' : 'Coach');

  return (
    <div className={cn('flex', isYou ? 'justify-end' : 'justify-start', className)}>
      <div
        className={cn(
          'max-w-[88%] px-4 py-3 text-sm leading-relaxed',
          isYou
            ? 'rounded-2xl rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-2xl rounded-bl-sm border border-border bg-background'
        )}
      >
        <span
          className={cn(
            'block text-[10px] uppercase tracking-wider mb-1.5 font-medium',
            isYou ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {labelText}
        </span>
        {children}
      </div>
    </div>
  );
}
