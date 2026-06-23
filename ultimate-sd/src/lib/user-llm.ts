import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { prisma } from '@/lib/prisma';
import {
  canUseAI,
  getEffectivePlanType,
  type UserAccess,
} from '@/lib/access';
import { AI_MONTHLY_CREDITS, type PlanType } from '@/lib/plans';
import { getNextAiCreditsResetDate } from '@/lib/access';

export type LLMSource = 'byok' | 'platform_credits' | 'server';

export interface UserLLMResult {
  llm: ChatGoogleGenerativeAI;
  source: LLMSource;
}

export class AIAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIAccessError';
  }
}

function selectApiKey(user: UserAccess): string | null {
  if (user.preferredProvider === 'xai' && user.xaiApiKey) {
    return user.xaiApiKey;
  }
  if (user.geminiApiKey) {
    return user.geminiApiKey;
  }
  if (user.xaiApiKey) {
    return user.xaiApiKey;
  }
  return null;
}

function createGeminiLLM(apiKey: string, temperature = 0.7): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-lite',
    apiKey,
    temperature,
  });
}

async function loadUserAccess(userId: string): Promise<UserAccess | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      planExpiresAt: true,
      aiCredits: true,
      geminiApiKey: true,
      xaiApiKey: true,
      preferredProvider: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    planType: getEffectivePlanType({
      planType: user.planType as PlanType,
      planExpiresAt: user.planExpiresAt,
    }),
    planExpiresAt: user.planExpiresAt,
    aiCredits: user.aiCredits,
    geminiApiKey: user.geminiApiKey,
    xaiApiKey: user.xaiApiKey,
    preferredProvider: user.preferredProvider,
  };
}

export async function getUserLLM(
  userId: string,
  options?: { temperature?: number; consumeCredit?: boolean; problemSlug?: string }
): Promise<UserLLMResult> {
  const user = await loadUserAccess(userId);
  if (!user) {
    throw new AIAccessError('User not found.');
  }

  const access = canUseAI(user, options?.problemSlug);
  if (!access.allowed) {
    throw new AIAccessError(access.reason ?? 'AI access denied.');
  }

  if (access.source === 'byok') {
    const apiKey = selectApiKey(user);
    if (!apiKey) {
      throw new AIAccessError('Add your API key in Settings to use AI.');
    }
    return {
      llm: createGeminiLLM(apiKey, options?.temperature ?? 0.7),
      source: 'byok',
    };
  }

  if (access.source === 'platform_credits' || access.source === 'server') {
    const serverKey = process.env.GOOGLE_API_KEY;
    if (!serverKey) {
      throw new AIAccessError('AI service is temporarily unavailable.');
    }

    if (access.source === 'platform_credits' && options?.consumeCredit !== false) {
      const updated = await prisma.user.updateMany({
        where: { id: userId, aiCredits: { gt: 0 } },
        data: { aiCredits: { decrement: 1 } },
      });

      if (updated.count === 0) {
        throw new AIAccessError('You have used all AI credits for this month.');
      }
    }

    return {
      llm: createGeminiLLM(serverKey, options?.temperature ?? 0.7),
      source: access.source,
    };
  }

  throw new AIAccessError('AI access denied.');
}

export async function activateUserPlan(
  userId: string,
  planType: 'platform' | 'ai'
): Promise<void> {
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      planType,
      planActivatedAt: now,
      planExpiresAt: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      aiCredits: planType === 'ai' ? AI_MONTHLY_CREDITS : 0,
      aiCreditsResetAt: planType === 'ai' ? getNextAiCreditsResetDate(now) : null,
    },
  });
}
