import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { getVoiceCredentials, VoiceAccessError } from '@/lib/voice-server';

const mocked = vi.mocked(prisma, true);

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    planType: 'ai',
    planExpiresAt: new Date(Date.now() + 86_400_000),
    aiCredits: 10,
    openaiApiKey: null,
    preferredProvider: 'gemini',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENAI_API_KEY = 'sk-platform';
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe('getVoiceCredentials', () => {
  it('ai plan with credits gets the platform key', async () => {
    mocked.user.findUnique.mockResolvedValue(userRow() as never);
    expect(await getVoiceCredentials('u1')).toEqual({
      apiKey: 'sk-platform',
      source: 'platform',
    });
  });

  it('throws a clean error when the platform key is not configured', async () => {
    delete process.env.OPENAI_API_KEY;
    mocked.user.findUnique.mockResolvedValue(userRow() as never);
    await expect(getVoiceCredentials('u1')).rejects.toThrow(
      'Voice service is temporarily unavailable.'
    );
  });

  it('platform plan uses the user BYOK OpenAI key', async () => {
    mocked.user.findUnique.mockResolvedValue(
      userRow({ planType: 'platform', aiCredits: 0, openaiApiKey: 'sk-user' }) as never
    );
    expect(await getVoiceCredentials('u1')).toEqual({
      apiKey: 'sk-user',
      source: 'byok',
    });
  });

  it('expired platform plan resolves as free and is denied', async () => {
    mocked.user.findUnique.mockResolvedValue(
      userRow({ planType: 'platform', planExpiresAt: new Date('2000-01-01'), aiCredits: 0 }) as never
    );
    await expect(getVoiceCredentials('u1')).rejects.toBeInstanceOf(VoiceAccessError);
  });

  it('propagates the audio-support reason for non-OpenAI providers', async () => {
    mocked.user.findUnique.mockResolvedValue(
      userRow({ planType: 'platform', aiCredits: 0, preferredProvider: 'aws' }) as never
    );
    await expect(getVoiceCredentials('u1')).rejects.toThrow(/doesn't support audio/i);
  });

  it('throws when the user does not exist', async () => {
    mocked.user.findUnique.mockResolvedValue(null as never);
    await expect(getVoiceCredentials('ghost')).rejects.toBeInstanceOf(VoiceAccessError);
  });
});
