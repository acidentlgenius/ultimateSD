export type PlanType = 'free' | 'platform' | 'ai';

export const FREE_PROBLEM_SLUGS = [
  'design-tinyurl',
  'design-parking-lot',
  'design-elevator-system',
  'design-unique-id-generator',
  'design-typeahead-suggestion',
  'design-distributed-cache',
  'design-dropbox',
  'design-whatsapp',
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

/** Monthly AI credits for free-tier users on free problems */
export const FREE_MONTHLY_CREDITS = 20;

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  platform: 'Platform',
  ai: 'AI',
};

export const PLAN_WELCOME_DESCRIPTIONS: Record<Exclude<PlanType, 'free'>, string> = {
  platform: 'full access to all practice problems on the platform',
  ai: 'full access to all practice problems plus monthly AI credits for feedback and the help assistant',
};
