import { describe, expect, it } from 'vitest';
import { FEATURE_KEYS, FEATURE_SEED_DEFAULTS, PLAN_PRICES_INR, PLAN_PRICES_PAISE } from '@/lib/plans';
import { resolveFeatureAccess } from '@/lib/feature-flags';

describe('feature seed defaults', () => {
  it('defines all six feature keys', () => {
    expect(FEATURE_KEYS).toEqual([
      'fresherTrack',
      'interviewMode',
      'aiProbe',
      'lifetimePlan',
      'voiceInterview',
      'adaptiveCoach',
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

describe('resolveFeatureAccess', () => {
  it('granted override wins regardless of plan and flag', () => {
    expect(
      resolveFeatureAccess({ override: 'granted', enabledPlans: [], plan: 'free' })
    ).toBe(true);
  });

  it('denied override wins even when the plan is enabled', () => {
    expect(
      resolveFeatureAccess({ override: 'denied', enabledPlans: ['ai'], plan: 'ai' })
    ).toBe(false);
  });

  it('no override: allowed only when plan is in enabledPlans', () => {
    expect(
      resolveFeatureAccess({ override: null, enabledPlans: ['platform', 'ai'], plan: 'ai' })
    ).toBe(true);
    expect(
      resolveFeatureAccess({ override: null, enabledPlans: ['platform', 'ai'], plan: 'free' })
    ).toBe(false);
  });

  it('empty enabledPlans means dark for everyone', () => {
    for (const plan of ['free', 'platform', 'lifetime', 'ai'] as const) {
      expect(resolveFeatureAccess({ override: null, enabledPlans: [], plan })).toBe(false);
    }
  });
});
