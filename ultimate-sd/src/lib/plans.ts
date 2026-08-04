export type PlanType = 'free' | 'platform' | 'lifetime' | 'ai';

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
  lifetime: 1999,
  ai: 699,
};

export const PLAN_PRICES_PAISE: Record<Exclude<PlanType, 'free'>, number> = {
  platform: 29900,
  lifetime: 199900,
  ai: 69900,
};

/** Monthly AI credits included with the AI plan */
export const AI_MONTHLY_CREDITS = 500;

/** Monthly AI credits for free-tier users on free problems */
export const FREE_MONTHLY_CREDITS = 20;

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  platform: 'Platform',
  lifetime: 'Lifetime',
  ai: 'AI',
};

export const PLAN_WELCOME_DESCRIPTIONS: Record<Exclude<PlanType, 'free'>, string> = {
  platform: 'full access to all practice problems on the platform',
  lifetime: 'Lifetime access to the full problem library, solutions, and interview mode. Bring your own API key for AI features.',
  ai: 'full access to all practice problems plus monthly AI credits for feedback and the help assistant',
};

export const FEATURE_KEYS = [
  'fresherTrack',
  'interviewMode',
  'aiProbe',
  'lifetimePlan',
  'voiceInterview',
  'adaptiveCoach',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/**
 * Intended plan sets per feature once fully launched (documentation +
 * admin-UI hint). All flags SEED as [] — dark. The DB row is live truth.
 *
 * Intended at full launch:
 *   fresherTrack   → free, platform, lifetime, ai
 *   interviewMode  → platform, lifetime, ai
 *   aiProbe        → ai (funded); BYOK path handled in feature code
 *   lifetimePlan   → free, platform, lifetime, ai (pricing page visibility)
 *   voiceInterview → ai (funded); BYOK on platform/lifetime in feature code
 *   adaptiveCoach  → platform, lifetime, ai
 */
export const FEATURE_SEED_DEFAULTS: Record<FeatureKey, PlanType[]> = {
  fresherTrack: [],
  interviewMode: [],
  aiProbe: [],
  lifetimePlan: [],
  voiceInterview: [],
  adaptiveCoach: [],
};

export const FEATURE_INTENDED_PLANS: Record<FeatureKey, PlanType[]> = {
  fresherTrack: ['free', 'platform', 'lifetime', 'ai'],
  interviewMode: ['platform', 'lifetime', 'ai'],
  aiProbe: ['ai'],
  lifetimePlan: ['free', 'platform', 'lifetime', 'ai'],
  voiceInterview: ['ai'],
  adaptiveCoach: ['platform', 'lifetime', 'ai'],
};
