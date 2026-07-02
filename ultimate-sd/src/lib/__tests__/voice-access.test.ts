import { describe, expect, it } from 'vitest';
import { canUseVoice } from '@/lib/voice-access';

const base = { aiCredits: 0, openaiApiKey: null, preferredProvider: 'gemini' };

describe('canUseVoice', () => {
  it('ai plan with credits is platform-funded', () => {
    expect(canUseVoice({ ...base, plan: 'ai', aiCredits: 5 })).toEqual({
      allowed: true,
      source: 'platform',
    });
  });

  it('ai plan with no credits falls back to their OpenAI key', () => {
    expect(
      canUseVoice({ ...base, plan: 'ai', openaiApiKey: 'sk-user' })
    ).toEqual({ allowed: true, source: 'byok' });
  });

  it('ai plan with no credits and no key is denied with a credits message', () => {
    const decision = canUseVoice({ ...base, plan: 'ai' });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/credits/i);
  });

  it('platform and lifetime plans use BYOK OpenAI key', () => {
    for (const plan of ['platform', 'lifetime'] as const) {
      expect(
        canUseVoice({ ...base, plan, openaiApiKey: 'sk-user' })
      ).toEqual({ allowed: true, source: 'byok' });
    }
  });

  it('non-OpenAI BYOK provider without an OpenAI key gets a clean audio-support error', () => {
    const decision = canUseVoice({ ...base, plan: 'platform', preferredProvider: 'anthropic' });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/doesn't support audio/i);
    expect(decision.reason).toMatch(/anthropic/i);
  });

  it('OpenAI-preferring user who just has no key gets an add-key message', () => {
    const decision = canUseVoice({ ...base, plan: 'lifetime', preferredProvider: 'openai' });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/add your openai api key/i);
  });

  it('free plan is denied without a key (flag override testers can still BYOK)', () => {
    expect(canUseVoice({ ...base, plan: 'free' }).allowed).toBe(false);
    expect(
      canUseVoice({ ...base, plan: 'free', openaiApiKey: 'sk-user' })
    ).toEqual({ allowed: true, source: 'byok' });
  });

  it('platform plan never consumes platform funding even with stray credits', () => {
    expect(
      canUseVoice({ ...base, plan: 'platform', aiCredits: 10, openaiApiKey: 'sk-user' })
    ).toEqual({ allowed: true, source: 'byok' });
  });
});
