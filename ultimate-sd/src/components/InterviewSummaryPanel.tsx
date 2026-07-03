'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { StepData, SystemDesignProblem } from '@/types';
import type { InterviewSummary } from '@/lib/langgraph';
import {
  buildInterviewAnswers,
  type InterviewStatus,
  type InterviewStepDataLike,
} from '@/lib/interview-mode';

interface InterviewSummaryPanelProps {
  problem: SystemDesignProblem;
  phaseSteps: Record<string, StepData[]>;
  savedStepData: Map<string, InterviewStepDataLike>;
  status: InterviewStatus; // 'generating-summary' | 'complete' | 'summary-error'
  onSummaryReady: () => void;
  onSummaryFailed: () => void;
  onRetry: () => void;
  onExportPdf: () => Promise<void>;
  isExporting: boolean;
  onClose: () => void;
}

export default function InterviewSummaryPanel({
  problem,
  phaseSteps,
  savedStepData,
  status,
  onSummaryReady,
  onSummaryFailed,
  onRetry,
  onExportPdf,
  isExporting,
  onClose,
}: InterviewSummaryPanelProps) {
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (status !== 'generating-summary' || inFlightRef.current) return;
    inFlightRef.current = true;

    const run = async () => {
      try {
        const answers = buildInterviewAnswers(phaseSteps, savedStepData);
        const res = await fetch('/api/interview/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: problem.slug, answers }),
        });
        const data = await res.json();
        if (!res.ok || !data.summary) {
          setError(data.error ?? 'Could not generate your debrief.');
          onSummaryFailed();
          return;
        }
        setSummary(data.summary);
        onSummaryReady();
      } catch {
        setError('Could not generate your debrief.');
        onSummaryFailed();
      } finally {
        inFlightRef.current = false;
      }
    };
    void run();
  }, [status, phaseSteps, savedStepData, problem.slug, onSummaryReady, onSummaryFailed]);

  // Closing mid-generation would leave the in-flight debrief request orphaned
  // with no way to see its result, so the dialog can only be dismissed once
  // it has settled into 'complete' or 'summary-error'.
  const canClose = status !== 'generating-summary';

  return (
    <Dialog open onOpenChange={(next) => { if (!next && canClose) onClose(); }}>
      <DialogContent showCloseButton={canClose} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Interview Debrief</DialogTitle>
          <DialogDescription>
            {status === 'generating-summary'
              ? 'Your interview has ended. The AI interviewer is writing your debrief…'
              : `Timed interview for ${problem.title}.`}
          </DialogDescription>
        </DialogHeader>

        {status === 'generating-summary' && (
          <div className="flex items-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating your interview debrief…
          </div>
        )}

        {status === 'summary-error' && (
          <div className="py-4 space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {status === 'complete' && summary && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{summary.overallScore}/10</span>
              <Badge variant="outline">{summary.verdict}</Badge>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Strengths</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {summary.strengths.map((s, i) => (
                  <li key={`s-${i}`}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Improvements</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {summary.improvements.map((s, i) => (
                  <li key={`i-${i}`}>{s}</li>
                ))}
              </ul>
            </div>
            {summary.phaseNotes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1">Phase notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {summary.phaseNotes.map((n, i) => (
                    <li key={`p-${i}`}>
                      <span className="font-medium text-foreground">{n.phase}:</span> {n.comment}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {status === 'complete' && (
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => void onExportPdf()} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
