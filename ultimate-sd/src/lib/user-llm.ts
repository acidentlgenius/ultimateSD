import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatBedrockConverse } from '@langchain/aws';
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { prisma } from '@/lib/prisma';
import {
  canUseAI,
  getEffectivePlanType,
  getInitialAiCreditsForPlan,
  getNextAiCreditsResetDate,
  type UserAccess,
} from '@/lib/access';
import { type PlanType } from '@/lib/plans';

export type LLMSource = 'byok' | 'platform_credits' | 'server';

export interface UserLLMResult {
  llm: BaseChatModel;
  source: LLMSource;
}

export class AIAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIAccessError';
  }
}

function selectApiKey(user: UserAccess): Record<string, string | null> | null {
  switch (user.preferredProvider) {
    case 'xai':
      if (user.xaiApiKey) return { apiKey: user.xaiApiKey };
      break;
    case 'openai':
      if (user.openaiApiKey) return { apiKey: user.openaiApiKey };
      break;
    case 'anthropic':
      if (user.anthropicApiKey) return { apiKey: user.anthropicApiKey };
      break;
    case 'azure':
      if (user.azureOpenaiApiKey && user.azureOpenaiEndpoint) {
        return { apiKey: user.azureOpenaiApiKey, endpoint: user.azureOpenaiEndpoint };
      }
      break;
    case 'aws':
      if (user.awsBedrockAccessKey && user.awsBedrockSecretKey && user.awsBedrockRegion) {
        return {
          accessKey: user.awsBedrockAccessKey,
          secretKey: user.awsBedrockSecretKey,
          region: user.awsBedrockRegion,
        };
      }
      break;
    case 'ollama':
      if (user.ollamaEndpoint) {
        return { endpoint: user.ollamaEndpoint, model: user.ollamaModel || 'llama3' };
      }
      break;
    case 'gemini':
    default:
      if (user.geminiApiKey) return { apiKey: user.geminiApiKey };
      break;
  }

  if (user.geminiApiKey) return { apiKey: user.geminiApiKey };
  return null;
}

function createGeminiLLM(apiKey: string, temperature = 0.7): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey,
    temperature,
  });
}

function createOpenAILLM(apiKey: string, temperature = 0.7): ChatOpenAI {
  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    openAIApiKey: apiKey,
    temperature,
  });
}

function createXaiLLM(apiKey: string, temperature = 0.7): ChatOpenAI {
  return new ChatOpenAI({
    modelName: 'grok-2-latest',
    openAIApiKey: apiKey,
    temperature,
    configuration: {
        baseURL: "https://api.x.ai/v1",
    }
  });
}

function createAnthropicLLM(apiKey: string, temperature = 0.7): ChatAnthropic {
  return new ChatAnthropic({
    modelName: 'claude-3-5-sonnet-latest',
    anthropicApiKey: apiKey,
    temperature,
  });
}

function createAzureLLM(apiKey: string, endpoint: string, temperature = 0.7): AzureChatOpenAI {
  return new AzureChatOpenAI({
    azureOpenAIApiKey: apiKey,
    azureOpenAIBasePath: endpoint,
    azureOpenAIApiDeploymentName: 'gpt-4o', // Assumption, can make configurable later
    temperature,
  });
}

function createAWSBedrockLLM(accessKeyId: string, secretAccessKey: string, region: string, temperature = 0.7): ChatBedrockConverse {
  return new ChatBedrockConverse({
    model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    temperature,
  });
}

function createOllamaLLM(baseUrl: string, model: string, temperature = 0.7): ChatOllama {
  return new ChatOllama({
    baseUrl,
    model,
    temperature,
  });
}

async function ensureCreditsReset(userId: string, user: UserAccess): Promise<number> {
  const plan = getEffectivePlanType(user);
  if (plan !== 'ai' && plan !== 'free') {
    return user.aiCredits;
  }

  const monthlyCredits = getInitialAiCreditsForPlan(plan);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCreditsResetAt: true },
  });

  if (!dbUser?.aiCreditsResetAt) {
    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCredits: monthlyCredits,
        aiCreditsResetAt: getNextAiCreditsResetDate(now),
      },
    });
    return monthlyCredits;
  }

  if (new Date() >= dbUser.aiCreditsResetAt) {
    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCredits: monthlyCredits,
        aiCreditsResetAt: getNextAiCreditsResetDate(now),
      },
    });
    return monthlyCredits;
  }

  return user.aiCredits;
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
      openaiApiKey: true,
      anthropicApiKey: true,
      azureOpenaiApiKey: true,
      azureOpenaiEndpoint: true,
      awsBedrockRegion: true,
      awsBedrockAccessKey: true,
      awsBedrockSecretKey: true,
      ollamaEndpoint: true,
      ollamaModel: true,
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
    openaiApiKey: user.openaiApiKey,
    anthropicApiKey: user.anthropicApiKey,
    azureOpenaiApiKey: user.azureOpenaiApiKey,
    azureOpenaiEndpoint: user.azureOpenaiEndpoint,
    awsBedrockRegion: user.awsBedrockRegion,
    awsBedrockAccessKey: user.awsBedrockAccessKey,
    awsBedrockSecretKey: user.awsBedrockSecretKey,
    ollamaEndpoint: user.ollamaEndpoint,
    ollamaModel: user.ollamaModel,
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

  user.aiCredits = await ensureCreditsReset(userId, user);

  const access = canUseAI(user, options?.problemSlug);
  if (!access.allowed) {
    throw new AIAccessError(access.reason ?? 'AI access denied.');
  }

  if (access.source === 'byok') {
    const creds = selectApiKey(user);
    if (!creds) {
      throw new AIAccessError('Add your API key or credentials in Settings to use AI.');
    }

    const temp = options?.temperature ?? 0.7;
    let llm: BaseChatModel;

    switch (user.preferredProvider) {
      case 'xai':
        llm = createXaiLLM(creds.apiKey as string, temp);
        break;
      case 'openai':
        llm = createOpenAILLM(creds.apiKey as string, temp);
        break;
      case 'anthropic':
        llm = createAnthropicLLM(creds.apiKey as string, temp);
        break;
      case 'azure':
        llm = createAzureLLM(creds.apiKey as string, creds.endpoint as string, temp);
        break;
      case 'aws':
        llm = createAWSBedrockLLM(creds.accessKey as string, creds.secretKey as string, creds.region as string, temp);
        break;
      case 'ollama':
        llm = createOllamaLLM(creds.endpoint as string, creds.model as string, temp);
        break;
      case 'gemini':
      default:
        llm = createGeminiLLM(creds.apiKey as string, temp);
        break;
    }

    return { llm, source: 'byok' };
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
  planType: 'platform' | 'ai' | 'lifetime'
): Promise<void> {
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      planType,
      planActivatedAt: now,
      planExpiresAt:
        planType === 'lifetime'
          ? null
          : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      aiCredits: getInitialAiCreditsForPlan(planType),
      aiCreditsResetAt: planType === 'ai' ? getNextAiCreditsResetDate(now) : null,
    },
  });
}
