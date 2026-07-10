'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SeniorityLevel } from '@/lib/forge/types';

const OPTIONS: {
  value: SeniorityLevel;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { value: 'beginner', label: 'Beginner', emoji: '🌱', hint: '3 FRs · heavy guidance' },
  { value: 'intermediate', label: 'Intermediate', emoji: '🌿', hint: '4–5 FRs · balanced' },
  { value: 'advanced', label: 'Advanced', emoji: '🌳', hint: '2 seeds · light prompts' },
  { value: 'senior', label: 'Senior', emoji: '🏛', hint: 'Minimal scaffolding' },
  { value: 'architect', label: 'Architect', emoji: '⚡', hint: 'Open-ended · strict review' },
];

type SeniorityCalibrationModalProps = {
  open: boolean;
  value: SeniorityLevel;
  onChange: (level: SeniorityLevel) => void;
  onContinue: () => void;
  onSkip: () => void;
};

export function SeniorityCalibrationModal({
  open,
  value,
  onChange,
  onContinue,
  onSkip,
}: SeniorityCalibrationModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" data-testid="seniority-calibration">
        <DialogHeader>
          <DialogTitle>How deep should we go?</DialogTitle>
          <DialogDescription>
            This calibrates starter content, coach verbosity, and review strictness. You can change it anytime from the Journey Map.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-lg border p-4 text-left transition-colors hover:bg-accent',
                value === opt.value && 'border-primary bg-primary/5 ring-2 ring-primary/30'
              )}
            >
              <div className="mb-1 text-2xl">{opt.emoji}</div>
              <div className="font-medium">{opt.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{opt.hint}</div>
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={onContinue}>Continue →</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
