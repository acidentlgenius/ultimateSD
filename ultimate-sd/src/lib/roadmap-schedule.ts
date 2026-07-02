import type { RoadmapTrack } from '@/components/roadmap/RoadmapTypes';
import type { ProgressStatus } from '@/types';

export interface ScheduleWeek {
  week: number;
  title: string;
  focus: string;
  slugs: readonly string[];
}

/** 8-week study plan for the Software Engineer track (~4–6 hrs/week). */
export const SE_EIGHT_WEEK_SCHEDULE: readonly ScheduleWeek[] = [
  {
    week: 1,
    title: 'Interview basics',
    focus: 'Requirements + APIs',
    slugs: ['design-tinyurl', 'design-rest-api'],
  },
  {
    week: 2,
    title: 'IDs & deduplication',
    focus: 'Distributed IDs',
    slugs: ['design-unique-id-generator'],
  },
  {
    week: 3,
    title: 'Protect the service',
    focus: 'Rate limiting',
    slugs: ['design-rate-limiter'],
  },
  {
    week: 4,
    title: 'Async & notifications',
    focus: 'Pub/sub patterns',
    slugs: ['design-notification-system'],
  },
  {
    week: 5,
    title: 'Storage fundamentals',
    focus: 'KV store design',
    slugs: ['design-key-value-store'],
  },
  {
    week: 6,
    title: 'Real-time messaging',
    focus: 'Chat at scale',
    slugs: ['design-whatsapp'],
  },
  {
    week: 7,
    title: 'Files & sync',
    focus: 'Chunking + metadata',
    slugs: ['design-dropbox'],
  },
  {
    week: 8,
    title: 'Observability',
    focus: 'Logs + metrics',
    slugs: ['design-logging-system'],
  },
] as const;

/** 8-week study plan for the Fresher & Campus track (~5–8 hrs/week). */
export const FRESHER_EIGHT_WEEK_SCHEDULE: readonly ScheduleWeek[] = [
  {
    week: 1,
    title: 'Foundations first',
    focus: 'Concepts + canvas drills',
    slugs: [],
  },
  {
    week: 2,
    title: 'OOP warm-up',
    focus: 'Classes + allocation',
    slugs: ['design-parking-lot'],
  },
  {
    week: 3,
    title: 'State machines',
    focus: 'Scheduling logic',
    slugs: ['design-elevator-system'],
  },
  {
    week: 4,
    title: 'Your first HLD',
    focus: 'Hashing + redirects',
    slugs: ['design-tinyurl'],
  },
  {
    week: 5,
    title: 'APIs done right',
    focus: 'Resource modeling',
    slugs: ['design-rest-api'],
  },
  {
    week: 6,
    title: 'Protect the service',
    focus: 'Rate limiting',
    slugs: ['design-rate-limiter'],
  },
  {
    week: 7,
    title: 'Fan-out basics',
    focus: 'Pub/sub patterns',
    slugs: ['design-notification-system'],
  },
  {
    week: 8,
    title: 'Interview ready',
    focus: 'Timed mock + chat capstone',
    slugs: ['design-whatsapp'],
  },
] as const;

export function getScheduleForTrack(track: RoadmapTrack): readonly ScheduleWeek[] {
  switch (track) {
    case 'se':
      return SE_EIGHT_WEEK_SCHEDULE;
    case 'fresher':
      return FRESHER_EIGHT_WEEK_SCHEDULE;
    case 'sse':
    case 'mlops':
    case 'agentic-ai':
      return [];
    default: {
      const _exhaustive: never = track;
      return _exhaustive;
    }
  }
}

export type WeekScheduleStatus = 'complete' | 'in-progress' | 'upcoming';

export function getWeekScheduleStatus(
  week: ScheduleWeek,
  progressBySlug: Record<string, ProgressStatus>,
): WeekScheduleStatus {
  const statuses = week.slugs.map((slug) => progressBySlug[slug]);
  const allComplete = statuses.every(
    (s) => s === 'COMPLETED' || s === 'REVIEW_NEEDED',
  );
  if (allComplete && week.slugs.length > 0) return 'complete';

  const anyStarted = statuses.some(
    (s) => s === 'IN_PROGRESS' || s === 'COMPLETED' || s === 'REVIEW_NEEDED',
  );
  if (anyStarted) return 'in-progress';

  return 'upcoming';
}
