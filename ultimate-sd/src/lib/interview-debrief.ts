import type { InterviewSummary } from '@/lib/langgraph';

export type InterviewDebriefVariant = 'lite' | 'full' | 'voice';

export interface StoredInterviewDebrief {
  id: string;
  problemSlug: string;
  problemTitle: string;
  variant: InterviewDebriefVariant;
  overallScore: number;
  verdict: string;
  createdAt: Date;
}

const VARIANT_LABELS: Record<InterviewDebriefVariant, string> = {
  lite: '45-min Lite',
  full: '60-min Full',
  voice: 'Voice',
};

export function formatDebriefVariant(variant: InterviewDebriefVariant): string {
  return VARIANT_LABELS[variant];
}

export function isInterviewDebriefVariant(value: string): value is InterviewDebriefVariant {
  return value === 'lite' || value === 'full' || value === 'voice';
}

/** Strip full summary for list views — never send summaryJson to hub cards. */
export function toDebriefListItem(row: {
  id: string;
  problemSlug: string;
  variant: string;
  overallScore: number;
  verdict: string;
  createdAt: Date;
  problemTitle?: string;
}): StoredInterviewDebrief {
  const variant = isInterviewDebriefVariant(row.variant) ? row.variant : 'lite';
  return {
    id: row.id,
    problemSlug: row.problemSlug,
    problemTitle: row.problemTitle ?? row.problemSlug,
    variant,
    overallScore: row.overallScore,
    verdict: row.verdict,
    createdAt: row.createdAt,
  };
}

export function summaryToPersistPayload(
  variant: InterviewDebriefVariant,
  problemId: string,
  problemSlug: string,
  summary: InterviewSummary
) {
  return {
    problemId,
    problemSlug,
    variant,
    overallScore: summary.overallScore,
    verdict: summary.verdict,
    summaryJson: summary,
  };
}
