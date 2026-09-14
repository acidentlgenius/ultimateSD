'use client';

import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CircleAlert, Lightbulb } from 'lucide-react';
import { updateStreak } from '@/app/actions/gamification';
import { LockedFeatureButton } from '@/components/LockedFeatureButton';
import { cn } from '@/lib/utils';
import type { GateDecision } from '@/lib/adaptive-coach/types';

export type StepFeedbackData = {
  score: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  missed?: string[];
  isAcceptable: boolean;
};

export type StepFeedbackPanelProps = {
  feedback: StepFeedbackData;
  tip?: string | null;
  gate?: GateDecision | null;
  xpEarned?: number;
  probeEntitled: boolean;
  onStartProbe: () => void;
};

/**
 * Compact review critique — status strip + actionable notes.
 * No trophy hero / giant score (those waste the pane after one glance).
 */
export default function StepFeedbackPanel({
  feedback,
  tip,
  gate,
  xpEarned = 0,
  probeEntitled,
  onStartProbe,
}: StepFeedbackPanelProps) {
  const isCoachedAdvance =
    gate?.action === 'teach_forward' || gate?.action === 'advance_budget';

  useEffect(() => {
    if (feedback.isAcceptable && !isCoachedAdvance) {
      const runStreakUpdate = async () => {
        try {
          // SQUASH: Root Cause: Next.js Server Actions return error objects rather than throwing exceptions.
          // Appending .catch() to them silently swallows application-level errors.
          // SQUASH: Fix: Await the server action result and explicitly check for an `error` property,
          // while preserving a try/catch block for actual network exceptions.
          const result = await updateStreak();
          if (result && 'error' in result && result.error) {
            console.error('Failed to update streak:', result.error);
          }
        } catch (error) {
          console.error('Error updating streak:', error);
        }
      };
      void runStreakUpdate();
    }
  }, [feedback.isAcceptable, isCoachedAdvance]);

  const statusLabel = feedback.isAcceptable
    ? 'Passed'
    : isCoachedAdvance
      ? 'Coached forward'
      : 'Needs work';

  const statusTone = feedback.isAcceptable
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : isCoachedAdvance
      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
      : 'bg-orange-500/15 text-orange-800 dark:text-orange-200';

  const scoreTone =
    feedback.score >= 8
      ? 'text-emerald-700 dark:text-emerald-300'
      : feedback.score >= 6
        ? 'text-sky-700 dark:text-sky-300'
        : feedback.score >= 4
          ? 'text-amber-700 dark:text-amber-300'
          : 'text-rose-700 dark:text-rose-300';

  return (
    <div className="flex min-h-0 flex-col gap-4" data-testid="step-feedback-panel">
      {/* Status strip — one glance, then get out of the way */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 pb-3">
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
            statusTone,
          )}
        >
          {statusLabel}
        </span>
        <p className={cn('text-sm font-semibold tabular-nums', scoreTone)}>
          {feedback.score}
          <span className="font-normal text-muted-foreground">/10</span>
        </p>
        <div className="flex min-w-[7rem] flex-1 items-center gap-2 sm:max-w-[11rem]">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full',
                feedback.accuracy >= 70
                  ? 'bg-emerald-500'
                  : feedback.accuracy >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500',
              )}
              style={{ width: `${Math.min(100, Math.max(0, feedback.accuracy))}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {feedback.accuracy}%
          </span>
        </div>
        {xpEarned > 0 ? (
          <span className="text-xs tabular-nums text-muted-foreground">+{xpEarned} XP</span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {tip && isCoachedAdvance ? (
          <section className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Coach tip
            </p>
            <p className="text-sm leading-relaxed text-foreground">{tip}</p>
          </section>
        ) : null}

        {feedback.strengths.length > 0 ? (
          <NoteBlock
            title="What worked"
            items={feedback.strengths}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            accent="text-emerald-600 dark:text-emerald-400"
          />
        ) : null}

        {feedback.weaknesses.length > 0 ? (
          <NoteBlock
            title="In your answer"
            items={feedback.weaknesses}
            icon={<CircleAlert className="h-3.5 w-3.5" />}
            accent="text-amber-600 dark:text-amber-400"
          />
        ) : null}

        {feedback.missed && feedback.missed.length > 0 ? (
          <NoteBlock
            title="Not covered"
            items={feedback.missed}
            icon={<Lightbulb className="h-3.5 w-3.5" />}
            accent="text-sky-600 dark:text-sky-400"
          />
        ) : null}

        {feedback.isAcceptable ? (
          <div>
            {probeEntitled ? (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={onStartProbe}>
                Defend your design
              </Button>
            ) : (
              <LockedFeatureButton
                feature="aiProbe"
                label="Defend your design"
                tooltip="Available on the AI plan — an AI skeptic challenges your design like a real interviewer"
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NoteBlock({
  title,
  items,
  icon,
  accent,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
  accent: string;
}) {
  return (
    <section>
      <p className={cn('mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide', accent)}>
        {icon}
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-snug text-foreground/90 pl-0.5">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
