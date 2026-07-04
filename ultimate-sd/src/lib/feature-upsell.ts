import { FEATURE_INTENDED_PLANS, type FeatureKey, type PlanType } from '@/lib/plans';

export const FEATURE_UPSELL_COPY: Record<FeatureKey, { title: string; pitch: string }> = {
  interviewMode: {
    title: 'Interview Mode',
    pitch:
      'A timed mock interview with a strict countdown and no hints — then an AI hiring-committee debrief that scores your performance phase by phase, exportable as a PDF.',
  },
  voiceInterview: {
    title: 'Voice Interview',
    pitch:
      'Answer out loud, exactly like the real thing. Push-to-talk voice practice with an AI interviewer that listens, follows up, and keeps you talking through your design.',
  },
  aiProbe: {
    title: 'Defend your design',
    pitch:
      'After you pass a step, an AI skeptic challenges your design with the follow-up questions a real interviewer would ask — defend your choices under pressure.',
  },
  fresherTrack: {
    title: 'Fresher Track',
    pitch: 'A guided learning path built for engineers starting system design from scratch.',
  },
  lifetimePlan: {
    title: 'Lifetime Access',
    pitch: 'Pay once, own the full problem library, expert solutions, and interview mode forever.',
  },
};

/** Which pricing card to highlight when upselling this feature. */
const PLAN_HIGHLIGHT_PRIORITY: PlanType[] = ['ai', 'platform', 'lifetime'];

export function getFeatureHighlightPlan(feature: FeatureKey): PlanType | null {
  const intended = FEATURE_INTENDED_PLANS[feature];
  if (intended.includes('free')) return null;
  return PLAN_HIGHLIGHT_PRIORITY.find((plan) => intended.includes(plan)) ?? null;
}
