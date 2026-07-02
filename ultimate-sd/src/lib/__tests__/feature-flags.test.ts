import { describe, expect, it } from 'vitest';
import { FEATURE_KEYS, FEATURE_SEED_DEFAULTS, PLAN_PRICES_INR, PLAN_PRICES_PAISE } from '@/lib/plans';

describe('feature seed defaults', () => {
  it('defines all five feature keys', () => {
    expect(FEATURE_KEYS).toEqual([
      'fresherTrack',
      'interviewMode',
      'aiProbe',
      'lifetimePlan',
      'voiceInterview',
    ]);
  });

  it('every seed default is empty (dark launch)', () => {
    for (const key of FEATURE_KEYS) {
      expect(FEATURE_SEED_DEFAULTS[key]).toEqual([]);
    }
  });

  it('prices lifetime at 1999 INR / 199900 paise', () => {
    expect(PLAN_PRICES_INR.lifetime).toBe(1999);
    expect(PLAN_PRICES_PAISE.lifetime).toBe(199900);
  });
});
