import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      geminiApiKey: true,
      xaiApiKey: true,
      openaiApiKey: true,
      anthropicApiKey: true,
      azureOpenaiApiKey: true,
      awsBedrockAccessKey: true,
      ollamaEndpoint: true,
      preferredProvider: true,
      planType: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    hasGeminiKey: Boolean(user.geminiApiKey),
    hasXaiKey: Boolean(user.xaiApiKey),
    hasOpenaiKey: Boolean(user.openaiApiKey),
    hasAnthropicKey: Boolean(user.anthropicApiKey),
    hasAzureOpenaiKey: Boolean(user.azureOpenaiApiKey),
    hasAwsBedrockKey: Boolean(user.awsBedrockAccessKey),
    hasOllamaEndpoint: Boolean(user.ollamaEndpoint),
    preferredProvider: user.preferredProvider,
    planType: user.planType,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      geminiApiKey,
      xaiApiKey,
      openaiApiKey,
      anthropicApiKey,
      azureOpenaiApiKey,
      azureOpenaiEndpoint,
      awsBedrockRegion,
      awsBedrockAccessKey,
      awsBedrockSecretKey,
      ollamaEndpoint,
      ollamaModel,
      preferredProvider,
    } = await req.json() as any;

    const data: any = {};

    const stringFields = [
      'geminiApiKey',
      'xaiApiKey',
      'openaiApiKey',
      'anthropicApiKey',
      'azureOpenaiApiKey',
      'azureOpenaiEndpoint',
      'awsBedrockRegion',
      'awsBedrockAccessKey',
      'awsBedrockSecretKey',
      'ollamaEndpoint',
      'ollamaModel',
    ];

    const body = {
      geminiApiKey,
      xaiApiKey,
      openaiApiKey,
      anthropicApiKey,
      azureOpenaiApiKey,
      azureOpenaiEndpoint,
      awsBedrockRegion,
      awsBedrockAccessKey,
      awsBedrockSecretKey,
      ollamaEndpoint,
      ollamaModel,
    } as any;

    for (const field of stringFields) {
      if (typeof body[field] === 'string') {
        data[field] = body[field].trim() || null;
      }
    }

    const validProviders = ['gemini', 'xai', 'openai', 'anthropic', 'azure', 'aws', 'ollama'];
    if (validProviders.includes(preferredProvider)) {
      data.preferredProvider = preferredProvider;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save API keys error:', error);
    return NextResponse.json({ error: 'Failed to save API keys' }, { status: 500 });
  }
}
