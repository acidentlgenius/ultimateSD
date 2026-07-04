'use client';

import Link from 'next/link';
import { Mic, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InterviewDebriefVariant } from '@/lib/interview-debrief';
import { formatDebriefVariant } from '@/lib/interview-debrief';

interface InterviewVariantPickerProps {
  selected: InterviewDebriefVariant;
  onSelect: (variant: InterviewDebriefVariant) => void;
  interviewEntitled: boolean;
  voiceEntitled: boolean;
  disabled?: boolean;
}

const VARIANTS: Array<{
  id: InterviewDebriefVariant;
  label: string;
  description: string;
  icon: typeof Timer;
  feature?: 'voiceInterview';
}> = [
  {
    id: 'lite',
    label: '45-min Lite',
    description: 'Clarify → HLD → Trade-offs',
    icon: Timer,
  },
  {
    id: 'full',
    label: '60-min Full',
    description: 'Complete step set for this problem',
    icon: Timer,
  },
  {
    id: 'voice',
    label: 'Voice',
    description: 'Lite interview with spoken answers',
    icon: Mic,
    feature: 'voiceInterview',
  },
];

export function InterviewVariantPicker({
  selected,
  onSelect,
  interviewEntitled,
  voiceEntitled,
  disabled = false,
}: InterviewVariantPickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Interview variant">
      {VARIANTS.map((variant) => {
        const isVoice = variant.id === 'voice';
        const locked = !interviewEntitled || (isVoice && !voiceEntitled);
        const isSelected = selected === variant.id;

        if (locked) {
          const pricingFeature = isVoice ? 'voiceInterview' : 'interviewMode';
          return (
            <div key={variant.id} className="relative">
              <Button
                type="button"
                variant="outline"
                disabled
                className="w-full h-auto flex-col items-start gap-1 py-3 opacity-60"
                title={
                  isVoice
                    ? 'Available on the AI plan — practice answering out loud like a real interview'
                    : 'Available on the AI plan — timed mock interviews with AI debrief'
                }
              >
                <span className="flex items-center gap-2 font-medium">
                  <variant.icon className="h-4 w-4" />
                  {variant.label}
                  <Badge variant="secondary" className="text-xs">
                    🔒
                  </Badge>
                </span>
                <span className="text-xs text-muted-foreground font-normal">{variant.description}</span>
              </Button>
              <Link
                href={`/pricing?feature=${pricingFeature}`}
                className="absolute inset-0"
                aria-label={`See plans for ${variant.label}`}
              />
            </div>
          );
        }

        return (
          <Button
            key={variant.id}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            disabled={disabled}
            className={cn('w-full h-auto flex-col items-start gap-1 py-3', isSelected && 'ring-2 ring-primary')}
            onClick={() => onSelect(variant.id)}
            aria-pressed={isSelected}
          >
            <span className="flex items-center gap-2 font-medium">
              <variant.icon className="h-4 w-4" />
              {formatDebriefVariant(variant.id)}
            </span>
            <span className="text-xs text-muted-foreground font-normal">{variant.description}</span>
          </Button>
        );
      })}
    </div>
  );
}
