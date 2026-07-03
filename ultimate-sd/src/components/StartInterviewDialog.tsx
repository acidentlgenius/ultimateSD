'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InterviewVariantPicker } from '@/components/InterviewVariantPicker';
import type { InterviewDebriefVariant } from '@/lib/interview-debrief';

interface StartInterviewDialogProps {
  slug: string;
  interviewEntitled?: boolean;
  voiceEntitled?: boolean;
}

export function StartInterviewDialog({
  slug,
  interviewEntitled = true,
  voiceEntitled = false,
}: StartInterviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<InterviewDebriefVariant>('lite');
  const router = useRouter();

  const handleStart = () => {
    if (!interviewEntitled) return;
    if (variant === 'voice' && !voiceEntitled) return;
    router.push(`/practice/${slug}?interview=${variant}`);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start hover:bg-primary/10 hover:text-primary"
        onClick={() => setOpen(true)}
      >
        <Timer className="h-3.5 w-3.5 mr-2" />
        Start Interview
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a timed interview</DialogTitle>
            <DialogDescription>
              A strict countdown, no help assistant, and an AI hiring-committee debrief with
              PDF export at the end. Your current practice draft stays saved.
            </DialogDescription>
          </DialogHeader>
          <InterviewVariantPicker
            selected={variant}
            onSelect={setVariant}
            interviewEntitled={interviewEntitled}
            voiceEntitled={voiceEntitled}
          />
          <DialogFooter>
            <Button
              className="w-full"
              onClick={handleStart}
              disabled={!interviewEntitled || (variant === 'voice' && !voiceEntitled)}
            >
              Start {variant === 'lite' ? '45-min lite' : variant === 'full' ? '60-min full' : 'voice'}{' '}
              interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
