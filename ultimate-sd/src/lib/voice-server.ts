import { prisma } from '@/lib/prisma';
import { getEffectivePlanType } from '@/lib/access';
import { canUseVoice, type VoiceFundingSource } from '@/lib/voice-access';
import type { PlanType } from '@/lib/plans';

export class VoiceAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoiceAccessError';
  }
}

export interface VoiceCredentials {
  apiKey: string;
  source: VoiceFundingSource;
}

/**
 * Resolves which OpenAI key funds this user's audio calls.
 * Platform-funded ('ai' plan) → process.env.OPENAI_API_KEY.
 * BYOK ('platform'/'lifetime', or credit-exhausted 'ai') → user.openaiApiKey.
 * Credit consumption is NOT done here — the reply route's getUserLLM call
 * decrements one AI credit per voice turn for platform-funded users.
 */
export async function getVoiceCredentials(userId: string): Promise<VoiceCredentials> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      planExpiresAt: true,
      aiCredits: true,
      openaiApiKey: true,
      preferredProvider: true,
    },
  });

  if (!user) {
    throw new VoiceAccessError('User not found.');
  }

  const plan = getEffectivePlanType({
    planType: user.planType as PlanType,
    planExpiresAt: user.planExpiresAt,
  });

  const decision = canUseVoice({
    plan,
    aiCredits: user.aiCredits,
    openaiApiKey: user.openaiApiKey,
    preferredProvider: user.preferredProvider,
  });

  if (!decision.allowed || !decision.source) {
    throw new VoiceAccessError(decision.reason ?? 'Voice access denied.');
  }

  if (decision.source === 'platform') {
    const platformKey = process.env.OPENAI_API_KEY;
    if (!platformKey) {
      throw new VoiceAccessError('Voice service is temporarily unavailable.');
    }
    return { apiKey: platformKey, source: 'platform' };
  }

  return { apiKey: user.openaiApiKey as string, source: 'byok' };
}
