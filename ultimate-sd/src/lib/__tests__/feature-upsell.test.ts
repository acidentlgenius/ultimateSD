import { describe, expect, it } from 'vitest';
import { FEATURE_KEYS } from '@/lib/plans';
import { FEATURE_UPSELL_COPY, getFeatureHighlightPlan } from '@/lib/feature-upsell';

describe('FEATURE_UPSELL_COPY', () => {
  it('has title and pitch for every feature key', () => {
    for (const key of FEATURE_KEYS) {
      expect(FEATURE_UPSELL_COPY[key].title.length).toBeGreaterThan(0);
      expect(FEATURE_UPSELL_COPY[key].pitch.length).toBeGreaterThan(0);
    }
  });
});

describe('getFeatureHighlightPlan', () => {
  it('routes AI-plan features to the ai card', () => {
    expect(getFeatureHighlightPlan('aiProbe')).toBe('ai');
    expect(getFeatureHighlightPlan('voiceInterview')).toBe('ai');
    expect(getFeatureHighlightPlan('interviewMode')).toBe('ai');
  });

  it('returns null for features intended to include the free plan (nothing to upsell)', () => {
    expect(getFeatureHighlightPlan('fresherTrack')).toBeNull();
    expect(getFeatureHighlightPlan('lifetimePlan')).toBeNull();
    expect(getFeatureHighlightPlan('designForge')).toBeNull();
  });
});
