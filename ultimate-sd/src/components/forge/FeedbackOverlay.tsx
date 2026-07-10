'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ParsedFeedback } from '@/types';
import type { ForgeJourneyStep } from '@/lib/forge/types';
import { FRAME_THEME_COLORS } from '@/lib/forge/types';

type FeedbackOverlayProps = {
  step: ForgeJourneyStep;
  feedback: ParsedFeedback;
  onDismiss: () => void;
  onContinue?: () => void;
  canContinue: boolean;
};

export function FeedbackOverlay({
  step,
  feedback,
  onDismiss,
  onContinue,
  canContinue,
}: FeedbackOverlayProps) {
  const color = FRAME_THEME_COLORS[step.theme];
  const stars = '★'.repeat(Math.round(feedback.score)) + '☆'.repeat(5 - Math.round(feedback.score));

  return (
    <div
      className="pointer-events-none absolute inset-x-4 top-4 z-20 flex justify-center"
      data-testid="forge-feedback-overlay"
    >
      <div className="pointer-events-auto w-full max-w-lg animate-fade-in rounded-xl border bg-card/95 p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
              Review · Step {step.stepIndex + 1}
            </p>
            <h3 className="text-lg font-semibold">{step.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">{stars}</span>
            <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss feedback">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-4 space-y-2 text-sm">
          {feedback.strengths?.map((s) => (
            <p key={s} className="text-green-600 dark:text-green-400">✓ {s}</p>
          ))}
          {feedback.weaknesses?.map((w) => (
            <p key={w} className="text-amber-600 dark:text-amber-400">△ {w}</p>
          ))}
          {feedback.missed?.map((m) => (
            <p key={m} className="text-muted-foreground">• {m}</p>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Revise on canvas
          </Button>
          {canContinue && onContinue && (
            <Button size="sm" onClick={onContinue}>
              Continue →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
