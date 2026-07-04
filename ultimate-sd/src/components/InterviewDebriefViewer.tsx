import type { InterviewSummary } from '@/lib/langgraph';
import { formatDebriefVariant, isInterviewDebriefVariant } from '@/lib/interview-debrief';
import { Badge } from '@/components/ui/badge';

interface InterviewDebriefViewerProps {
  problemTitle: string;
  variant: string;
  summary: InterviewSummary;
  createdAt?: Date;
}

export function InterviewDebriefViewer({
  problemTitle,
  variant,
  summary,
  createdAt,
}: InterviewDebriefViewerProps) {
  const variantLabel = isInterviewDebriefVariant(variant)
    ? formatDebriefVariant(variant)
    : variant;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{problemTitle}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Badge variant="outline">{variantLabel}</Badge>
          {createdAt && <span>{createdAt.toLocaleDateString()}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-4xl font-bold">{summary.overallScore}/10</span>
        <Badge variant="outline">{summary.verdict}</Badge>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Strengths</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          {summary.strengths.map((s, i) => (
            <li key={`s-${i}`}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Improvements</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          {summary.improvements.map((s, i) => (
            <li key={`i-${i}`}>{s}</li>
          ))}
        </ul>
      </section>

      {summary.phaseNotes.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Phase notes</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            {summary.phaseNotes.map((n, i) => (
              <li key={`p-${i}`}>
                <span className="font-medium text-foreground">{n.phase}:</span> {n.comment}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
