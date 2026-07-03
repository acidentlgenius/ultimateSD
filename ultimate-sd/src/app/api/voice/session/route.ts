import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { requireVoiceAccess } from '../guard';

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const { slug, practiceSessionId = null } = await req.json();
  const problem = PROBLEMS.find((p) => p.slug === slug);
  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  try {
    await getVoiceCredentials(access.userId);
  } catch (error) {
    if (error instanceof VoiceAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  const question = `Let's begin the voice interview. We're designing ${problem.title}. To start: what are the core functional requirements you would focus on, and what scale should we assume?`;

  const voiceSession = await prisma.voiceSession.create({
    data: {
      userId: access.userId,
      problemId: problem.id,
      practiceSessionId,
      engine: 'turn-based',
      turns: { create: [{ role: 'interviewer', transcript: question }] },
    },
  });

  return NextResponse.json({ sessionId: voiceSession.id, question });
}
