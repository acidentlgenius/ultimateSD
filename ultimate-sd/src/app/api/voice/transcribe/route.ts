import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { transcribeAudio } from '@/lib/voice-openai';
import { requireVoiceAccess } from '../guard';

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const form = await req.formData();
  const sessionId = form.get('sessionId');
  const audio = form.get('audio');
  // Note: don't use `instanceof Blob` here — undici's File/Blob returned by
  // NextRequest#formData() can be a different realm than the global Blob in
  // some runtimes (observed in the Vitest/jsdom test environment), so
  // `instanceof` unreliably returns false. Duck-type instead.
  const isBlobLike =
    !!audio &&
    typeof audio === 'object' &&
    typeof (audio as Blob).arrayBuffer === 'function' &&
    typeof (audio as Blob).size === 'number';
  if (typeof sessionId !== 'string' || !isBlobLike) {
    return NextResponse.json({ error: 'sessionId and audio are required' }, { status: 400 });
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
    const transcript = await transcribeAudio(credentials.apiKey, audio as Blob);
    await prisma.voiceTurn.create({
      data: { voiceSessionId: sessionId, role: 'candidate', transcript },
    });
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('voice transcribe error:', error);
    return NextResponse.json(
      { error: 'Transcription failed. Please try again.' },
      { status: 502 }
    );
  }
}
