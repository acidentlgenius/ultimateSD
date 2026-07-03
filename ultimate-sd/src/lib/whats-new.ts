import type { PlanType } from '@/lib/plans';

export interface WhatsNewEntry {
  /** Stable slug; never reuse. Convention: yyyy-mm-short-name */
  id: string;
  /** ISO date yyyy-mm-dd. Entries MUST stay sorted newest-first. */
  date: string;
  title: string;
  description: string;
  /** Optional "Try it" deep link. */
  href?: string;
  /** Plans the feature is (or will be) available on. Omit = everyone. */
  plans?: PlanType[];
  status: 'live' | 'coming-soon';
}

/**
 * The product changelog. RELEASE PROCESS for feature-flag flips:
 * flip the flag → prepend an entry here (status 'live') → deploy.
 * The header notifier announces it to every active user automatically.
 */
export const WHATS_NEW_ENTRIES: WhatsNewEntry[] = [
  {
    id: '2026-07-ai-interviewer-preview',
    date: '2026-07-03',
    title: 'AI Interviewer is coming',
    description:
      'Timed mock interviews with a strict countdown, a voice interview you answer out loud, and an AI hiring-committee debrief at the end. Rolling out soon — join the waitlist from the home page.',
    href: '/#ai-interviewer',
    plans: ['platform', 'lifetime', 'ai'],
    status: 'coming-soon',
  },
  {
    id: '2026-07-unified-navigation',
    date: '2026-07-03',
    title: 'Blog, Draw and Custom Problems in the navigation',
    description:
      'The free diagram canvas, interactive articles, and custom problem builder now live under Learn and Practice in the main menu — on desktop and mobile.',
    href: '/draw',
    status: 'live',
  },
];

export const WHATS_NEW_LAST_SEEN_KEY = 'whats-new:last-seen';

export function getLatestEntry(): WhatsNewEntry | null {
  return WHATS_NEW_ENTRIES[0] ?? null;
}
