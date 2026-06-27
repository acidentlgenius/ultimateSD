import { FREE_PROBLEM_SLUGS, AI_MONTHLY_CREDITS, type PlanType } from '@/lib/plans';

export { FREE_PROBLEM_SLUGS };

export interface UserAccess {
  planType: PlanType;
  planExpiresAt: Date | null;
  aiCredits: number;
  geminiApiKey: string | null;
  xaiApiKey: string | null;
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  azureOpenaiApiKey: string | null;
  azureOpenaiEndpoint: string | null;
  awsBedrockRegion: string | null;
  awsBedrockAccessKey: string | null;
  awsBedrockSecretKey: string | null;
  ollamaEndpoint: string | null;
  ollamaModel: string | null;
  preferredProvider: string;
}

export interface UserAccessSnapshot {
  planType: PlanType;
  planExpiresAt: Date | null;
  hasActivePlan: boolean;
  hasPlatformPlan: boolean;
  hasAiPlan: boolean;
  hasGeminiKey: boolean;
  hasXaiKey: boolean;
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasAzureOpenaiKey: boolean;
  hasAwsBedrockKey: boolean;
  hasOllamaEndpoint: boolean;
  aiCredits: number;
  preferredProvider: string;
}

function normalizePlanType(planType: string | null | undefined): PlanType {
  if (planType === 'platform' || planType === 'ai') {
    return planType;
  }
  return 'free';
}

export function isProblemFree(slug: string): boolean {
  return (FREE_PROBLEM_SLUGS as readonly string[]).includes(slug);
}

export function isPlanActive(user: Pick<UserAccess, 'planType' | 'planExpiresAt'>): boolean {
  const planType = normalizePlanType(user.planType);
  if (planType === 'free') {
    return false;
  }
  if (!user.planExpiresAt) {
    return true;
  }
  return user.planExpiresAt.getTime() > Date.now();
}

export function getEffectivePlanType(user: Pick<UserAccess, 'planType' | 'planExpiresAt'>): PlanType {
  if (!isPlanActive(user)) {
    return 'free';
  }
  return normalizePlanType(user.planType);
}

export function hasPlatformAccess(user: Pick<UserAccess, 'planType' | 'planExpiresAt'>): boolean {
  const plan = getEffectivePlanType(user);
  return plan === 'platform' || plan === 'ai';
}

export function hasAiPlan(user: Pick<UserAccess, 'planType' | 'planExpiresAt'>): boolean {
  return getEffectivePlanType(user) === 'ai';
}

export function hasByokKey(
  user: Pick<
    UserAccess,
    | 'geminiApiKey'
    | 'xaiApiKey'
    | 'openaiApiKey'
    | 'anthropicApiKey'
    | 'azureOpenaiApiKey'
    | 'awsBedrockAccessKey'
    | 'ollamaEndpoint'
    | 'preferredProvider'
  >
): boolean {
  switch (user.preferredProvider) {
    case 'xai':
      return Boolean(user.xaiApiKey);
    case 'openai':
      return Boolean(user.openaiApiKey);
    case 'anthropic':
      return Boolean(user.anthropicApiKey);
    case 'azure':
      return Boolean(user.azureOpenaiApiKey);
    case 'aws':
      return Boolean(user.awsBedrockAccessKey);
    case 'ollama':
      return Boolean(user.ollamaEndpoint);
    case 'gemini':
    default:
      return Boolean(user.geminiApiKey);
  }
}

export function canAccessProblem(
  user: Pick<UserAccess, 'planType' | 'planExpiresAt'> | null | undefined,
  slug: string
): boolean {
  if (isProblemFree(slug)) {
    return true;
  }
  if (!user) {
    return false;
  }
  return hasPlatformAccess(user);
}

export function canUseAI(
  user: UserAccess | null | undefined,
  problemSlug?: string
): {
  allowed: boolean;
  reason?: string;
  source?: 'byok' | 'platform_credits' | 'server';
} {
  if (!user) {
    return { allowed: false, reason: 'Sign in to use AI features.' };
  }

  const plan = getEffectivePlanType(user);

  if (plan === 'free' && problemSlug && isProblemFree(problemSlug)) {
    if (hasByokKey(user)) {
      return { allowed: true, source: 'byok' };
    }
    return { allowed: true, source: 'server' };
  }

  if (plan === 'ai') {
    if (user.aiCredits > 0) {
      return { allowed: true, source: 'platform_credits' };
    }
    if (hasByokKey(user)) {
      return { allowed: true, source: 'byok' };
    }
    return {
      allowed: false,
      reason:
        'You have used all AI credits for this month. Add an API key in Settings or wait for credits to reset.',
    };
  }

  if (plan === 'platform') {
    if (hasByokKey(user)) {
      return { allowed: true, source: 'byok' };
    }
    return {
      allowed: false,
      reason: 'Add your preferred API key in Settings to use AI on the Platform plan.',
    };
  }

  return {
    allowed: false,
    reason: 'Upgrade to Platform (BYOK) or AI plan to unlock AI feedback and the help assistant.',
  };
}

export function toAccessSnapshot(user: UserAccess): UserAccessSnapshot {
  const planType = getEffectivePlanType(user);
  const active = isPlanActive(user);

  return {
    planType,
    planExpiresAt: user.planExpiresAt,
    hasActivePlan: active && planType !== 'free',
    hasPlatformPlan: active && (planType === 'platform' || planType === 'ai'),
    hasAiPlan: active && planType === 'ai',
    hasGeminiKey: Boolean(user.geminiApiKey),
    hasXaiKey: Boolean(user.xaiApiKey),
    hasOpenaiKey: Boolean(user.openaiApiKey),
    hasAnthropicKey: Boolean(user.anthropicApiKey),
    hasAzureOpenaiKey: Boolean(user.azureOpenaiApiKey),
    hasAwsBedrockKey: Boolean(user.awsBedrockAccessKey),
    hasOllamaEndpoint: Boolean(user.ollamaEndpoint),
    aiCredits: user.aiCredits,
    preferredProvider: user.preferredProvider,
  };
}

export function getNextAiCreditsResetDate(from = new Date()): Date {
  const reset = new Date(from);
  reset.setMonth(reset.getMonth() + 1);
  return reset;
}

export function getPlanExpiryDate(from = new Date()): Date {
  const expiry = new Date(from);
  expiry.setMonth(expiry.getMonth() + 1);
  return expiry;
}

export function getInitialAiCreditsForPlan(planType: PlanType): number {
  return planType === 'ai' ? AI_MONTHLY_CREDITS : 0;
}
