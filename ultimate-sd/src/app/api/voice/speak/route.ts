import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { synthesizeSpeech } from '@/lib/voice-openai';
import { requireVoiceAccess } from '../guard';

const MAX_TTS_CHARS = 1500;

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const { sessionId, text } = await req.json();
  if (typeof sessionId !== 'string' || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'sessionId and text are required' }, { status: 400 });
  }

  const voiceSession = await prisma.voiceSession.findUnique({ where: { id: sessionId } });
  if (!voiceSession || voiceSession.userId !== access.userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let credentials;
  try {
    credentials = await getVoiceCredentials(access.userId);
  } catch (error) {
    if (error instanceof VoiceAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  try {
    const audio = await synthesizeSpeech(credentials.apiKey, text.slice(0, MAX_TTS_CHARS));
    return new NextResponse(audio, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('voice speak error:', error);
    return NextResponse.json(
      { error: 'Speech synthesis failed. Please try again.' },
      { status: 502 }
    );
  }
}
