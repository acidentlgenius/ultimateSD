// @vitest-environment node
// Server route test: needs Node's native FormData/Blob/File — under jsdom,
// undici rejects jsdom's File instances when parsing multipart bodies.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));
vi.mock('@/lib/voice-server', () => {
  class VoiceAccessError extends Error {}
  return { getVoiceCredentials: vi.fn(), VoiceAccessError };
});
vi.mock('@/lib/voice-openai', () => ({
  transcribeAudio: vi.fn(),
  synthesizeSpeech: vi.fn(),
  VoiceProviderError: class VoiceProviderError extends Error {},
}));
vi.mock('@/lib/user-llm', () => {
  class AIAccessError extends Error {}
  return { getUserLLM: vi.fn(), AIAccessError };
});
vi.mock('@/lib/langgraph', () => ({ getAIResponse: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    voiceSession: { create: vi.fn(), findUnique: vi.fn() },
    voiceTurn: { create: vi.fn() },
  },
}));

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';
import { transcribeAudio, synthesizeSpeech } from '@/lib/voice-openai';
import { getUserLLM } from '@/lib/user-llm';
import { getAIResponse } from '@/lib/langgraph';
import { prisma } from '@/lib/prisma';
import { POST as postSession } from '@/app/api/voice/session/route';
import { POST as postTranscribe } from '@/app/api/voice/transcribe/route';
import { POST as postReply } from '@/app/api/voice/reply/route';
import { POST as postSpeak } from '@/app/api/voice/speak/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedCreds = vi.mocked(getVoiceCredentials);
const mockedPrisma = vi.mocked(prisma, true);

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function signIn() {
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('voice route gating', () => {
  it('all voice routes return 401 without a session', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const responses = await Promise.all([
      postSession(jsonRequest('http://test/api/voice/session', { slug: 'design-tinyurl' })),
      postReply(jsonRequest('http://test/api/voice/reply', { sessionId: 's', transcript: 'x' })),
      postSpeak(jsonRequest('http://test/api/voice/speak', { sessionId: 's', text: 'x' })),
    ]);
    for (const res of responses) expect(res.status).toBe(401);
  });

  it('all voice routes return 403 while the flag is dark', async () => {
    signIn();
    mockedFlag.mockResolvedValue(false);
    const responses = await Promise.all([
      postSession(jsonRequest('http://test/api/voice/session', { slug: 'design-tinyurl' })),
      postReply(jsonRequest('http://test/api/voice/reply', { sessionId: 's', transcript: 'x' })),
      postSpeak(jsonRequest('http://test/api/voice/speak', { sessionId: 's', text: 'x' })),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(403);
    }
    expect(mockedFlag).toHaveBeenCalledWith('u1', 'voiceInterview');
  });
});

describe('POST /api/voice/session', () => {
  it('404s an unknown problem slug', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    const res = await postSession(
      jsonRequest('http://test/api/voice/session', { slug: 'not-a-problem' })
    );
    expect(res.status).toBe(404);
  });

  it('403s with the funding reason when voice is not funded', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockRejectedValue(new VoiceAccessError('Voice interviews are not included on the Free plan.'));
    const res = await postSession(
      jsonRequest('http://test/api/voice/session', { slug: 'design-tinyurl' })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/free plan/i);
  });

  it('creates a turn-based session with an opening interviewer turn', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockResolvedValue({ apiKey: 'sk', source: 'platform' });
    mockedPrisma.voiceSession.create.mockResolvedValue({ id: 'vs1' } as never);

    const res = await postSession(
      jsonRequest('http://test/api/voice/session', {
        slug: 'design-tinyurl',
        practiceSessionId: 'ps1',
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe('vs1');
    expect(body.question.length).toBeGreaterThan(10);
    // Cast: Prisma's create-args overload union makes `.data.turns.create[0]`
    // untypeable without narrowing that would obscure the assertion below.
    const createArg = mockedPrisma.voiceSession.create.mock.calls[0][0] as any;
    expect(createArg.data.engine).toBe('turn-based');
    expect(createArg.data.practiceSessionId).toBe('ps1');
    expect(createArg.data.turns.create[0].role).toBe('interviewer');
  });
});

describe('POST /api/voice/transcribe', () => {
  it('transcribes the audio and persists a candidate turn', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockResolvedValue({ apiKey: 'sk', source: 'byok' });
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({ id: 'vs1', userId: 'u1' } as never);
    vi.mocked(transcribeAudio).mockResolvedValue('use consistent hashing');
    mockedPrisma.voiceTurn.create.mockResolvedValue({} as never);

    const form = new FormData();
    form.append('sessionId', 'vs1');
    form.append('audio', new Blob(['bytes'], { type: 'audio/webm' }), 'a.webm');
    const req = new NextRequest('http://test/api/voice/transcribe', {
      method: 'POST',
      body: form,
    });

    const res = await postTranscribe(req);
    expect(res.status).toBe(200);
    expect((await res.json()).transcript).toBe('use consistent hashing');
    expect(mockedPrisma.voiceTurn.create).toHaveBeenCalledWith({
      data: { voiceSessionId: 'vs1', role: 'candidate', transcript: 'use consistent hashing' },
    });
  });

  it("404s a session that belongs to someone else", async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({ id: 'vs1', userId: 'other' } as never);

    const form = new FormData();
    form.append('sessionId', 'vs1');
    form.append('audio', new Blob(['bytes']), 'a.webm');
    const res = await postTranscribe(
      new NextRequest('http://test/api/voice/transcribe', { method: 'POST', body: form })
    );
    expect(res.status).toBe(404);
  });
});

describe('POST /api/voice/reply', () => {
  it('runs the transcript through the interviewer pipeline and persists the reply', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({
      id: 'vs1',
      userId: 'u1',
      problemId: '1',
      turns: [
        { id: 't1', role: 'interviewer', transcript: 'Opening question', createdAt: new Date() },
      ],
    } as never);
    vi.mocked(getUserLLM).mockResolvedValue({ llm: {} as never, source: 'platform_credits' });
    vi.mocked(getAIResponse).mockResolvedValue({
      id: 'r1',
      role: 'ai',
      content: 'How would you shard the database?',
      timestamp: new Date(),
    });
    mockedPrisma.voiceTurn.create.mockResolvedValue({} as never);

    const res = await postReply(
      jsonRequest('http://test/api/voice/reply', { sessionId: 'vs1', transcript: 'I would cache reads' })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).text).toBe('How would you shard the database?');
    expect(mockedPrisma.voiceTurn.create).toHaveBeenCalledWith({
      data: {
        voiceSessionId: 'vs1',
        role: 'interviewer',
        transcript: 'How would you shard the database?',
      },
    });
  });
});

describe('POST /api/voice/speak', () => {
  it('returns audio/mpeg bytes from TTS', async () => {
    signIn();
    mockedFlag.mockResolvedValue(true);
    mockedCreds.mockResolvedValue({ apiKey: 'sk', source: 'platform' });
    mockedPrisma.voiceSession.findUnique.mockResolvedValue({ id: 'vs1', userId: 'u1' } as never);
    vi.mocked(synthesizeSpeech).mockResolvedValue(new Uint8Array([9, 9]).buffer);

    const res = await postSpeak(
      jsonRequest('http://test/api/voice/speak', { sessionId: 'vs1', text: 'Hello' })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([9, 9]));
  });
});
