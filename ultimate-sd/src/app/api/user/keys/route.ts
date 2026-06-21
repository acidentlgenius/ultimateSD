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

    const { geminiApiKey, xaiApiKey, preferredProvider } = await req.json() as {
      geminiApiKey?: string;
      xaiApiKey?: string;
      preferredProvider?: string;
    };

    const data: {
      geminiApiKey?: string | null;
      xaiApiKey?: string | null;
      preferredProvider?: string;
    } = {};

    if (typeof geminiApiKey === 'string') {
      data.geminiApiKey = geminiApiKey.trim() || null;
    }

    if (typeof xaiApiKey === 'string') {
      data.xaiApiKey = xaiApiKey.trim() || null;
    }

    if (preferredProvider === 'gemini' || preferredProvider === 'xai') {
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
