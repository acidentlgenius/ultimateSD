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

export function StartInterviewDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button className="w-full" onClick={() => router.push(`/practice/${slug}?interview=lite`)}>
              45-min lite — Clarify → HLD → Trade-offs
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/practice/${slug}?interview=full`)}
            >
              60-min full — complete step set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
