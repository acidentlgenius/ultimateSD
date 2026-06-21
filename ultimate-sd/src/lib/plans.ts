export type PlanType = 'free' | 'platform' | 'ai';

export const FREE_PROBLEM_SLUGS = [
  'design-tinyurl',
  'design-parking-lot',
  'design-elevator-system',
] as const;

export const PLAN_PRICES_INR: Record<Exclude<PlanType, 'free'>, number> = {
  platform: 299,
  ai: 699,
};

export const PLAN_PRICES_PAISE: Record<Exclude<PlanType, 'free'>, number> = {
  platform: 29900,
  ai: 69900,
};

/** Monthly AI credits included with the AI plan */
export const AI_MONTHLY_CREDITS = 500;

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  platform: 'Platform',
  ai: 'AI',
};
