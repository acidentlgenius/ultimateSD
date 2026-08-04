import { describe, expect, it } from 'vitest';
import {
  FEATURE_KEYS,
  FEATURE_SEED_DEFAULTS,
  FEATURE_INTENDED_PLANS,
} from '@/lib/plans';

describe('adaptiveCoach flag', () => {
  it('is registered, seeds dark, intended for platform/lifetime/ai', () => {
    expect(FEATURE_KEYS).toContain('adaptiveCoach');
    expect(FEATURE_SEED_DEFAULTS.adaptiveCoach).toEqual([]);
    expect(FEATURE_INTENDED_PLANS.adaptiveCoach).toEqual([
      'platform',
      'lifetime',
      'ai',
    ]);
  });
});
