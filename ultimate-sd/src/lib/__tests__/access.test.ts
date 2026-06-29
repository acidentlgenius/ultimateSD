import { describe, expect, it } from 'vitest';
import { canUseAI, getAdminGrantExpiryDate, type UserAccess } from '@/lib/access';
import { FREE_MONTHLY_CREDITS } from '@/lib/plans';

function makeUser(overrides: Partial<UserAccess> = {}): UserAccess {
  return {
    planType: 'free',
    planExpiresAt: null,
    aiCredits: FREE_MONTHLY_CREDITS,
    geminiApiKey: null,
    xaiApiKey: null,
    openaiApiKey: null,
    anthropicApiKey: null,
    azureOpenaiApiKey: null,
    azureOpenaiEndpoint: null,
    awsBedrockRegion: null,
    awsBedrockAccessKey: null,
    awsBedrockSecretKey: null,
    ollamaEndpoint: null,
    ollamaModel: null,
    preferredProvider: 'gemini',
    ...overrides,
  };
}

describe('getAdminGrantExpiryDate', () => {
  it('returns a date 3 months after the given date', () => {
    const from = new Date('2026-01-15T12:00:00.000Z');
    const expiry = getAdminGrantExpiryDate(from);
    expect(expiry.getFullYear()).toBe(2026);
    expect(expiry.getMonth()).toBe(3); // April (0-indexed)
    expect(expiry.getDate()).toBe(15);
  });
});

describe('canUseAI', () => {
  it('denies unauthenticated users', () => {
    expect(canUseAI(null)).toEqual({
      allowed: false,
      reason: 'Sign in to use AI features.',
    });
  });

  describe('free plan', () => {
    it('allows platform credits on free problems when credits remain', () => {
      const result = canUseAI(makeUser({ aiCredits: 5 }), 'design-tinyurl');
      expect(result).toEqual({ allowed: true, source: 'platform_credits' });
    });

    it('falls back to BYOK when credits are exhausted on free problems', () => {
      const result = canUseAI(
        makeUser({ aiCredits: 0, geminiApiKey: 'test-key' }),
        'design-tinyurl'
      );
      expect(result).toEqual({ allowed: true, source: 'byok' });
    });

    it('denies when credits exhausted and no BYOK on free problems', () => {
      const result = canUseAI(makeUser({ aiCredits: 0 }), 'design-tinyurl');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(String(FREE_MONTHLY_CREDITS));
    });

    it('denies on paid problems without upgrade', () => {
      const result = canUseAI(makeUser(), 'design-twitter');
      expect(result).toEqual({
        allowed: false,
        reason:
          'Upgrade to Platform (BYOK) or AI plan to unlock AI feedback and the help assistant.',
      });
    });
  });

  describe('ai plan', () => {
    const aiUser = makeUser({
      planType: 'ai',
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiCredits: 10,
    });

    it('allows platform credits when credits remain', () => {
      expect(canUseAI(aiUser, 'design-twitter')).toEqual({
        allowed: true,
        source: 'platform_credits',
      });
    });

    it('falls back to BYOK when credits exhausted', () => {
      const result = canUseAI(
        { ...aiUser, aiCredits: 0, geminiApiKey: 'test-key' },
        'design-twitter'
      );
      expect(result).toEqual({ allowed: true, source: 'byok' });
    });
  });

  describe('platform plan', () => {
    const platformUser = makeUser({
      planType: 'platform',
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiCredits: 0,
    });

    it('requires BYOK', () => {
      expect(canUseAI(platformUser, 'design-twitter')).toEqual({
        allowed: false,
        reason: 'Add your preferred API key in Settings to use AI on the Platform plan.',
      });
    });

    it('allows BYOK when key is configured', () => {
      const result = canUseAI(
        { ...platformUser, geminiApiKey: 'test-key' },
        'design-twitter'
      );
      expect(result).toEqual({ allowed: true, source: 'byok' });
    });
  });
});
