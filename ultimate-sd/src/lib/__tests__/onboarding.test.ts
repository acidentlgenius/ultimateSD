import { describe, expect, it } from 'vitest';
import {
  EXPERIENCE_LEVELS,
  PRACTICE_INTENTS,
  isExperienceLevel,
  isPracticeIntent,
} from '@/lib/onboarding';

describe('PRACTICE_INTENTS', () => {
  it('covers the three market segments', () => {
    expect(PRACTICE_INTENTS.map((i) => i.id)).toEqual(['interview', 'upskill', 'learn']);
  });

  it('every intent has label and description', () => {
    for (const intent of PRACTICE_INTENTS) {
      expect(intent.label.length).toBeGreaterThan(0);
      expect(intent.description.length).toBeGreaterThan(0);
    }
  });
});

describe('isPracticeIntent', () => {
  it('accepts known ids and rejects unknowns', () => {
    expect(isPracticeIntent('interview')).toBe(true);
    expect(isPracticeIntent('upskill')).toBe(true);
    expect(isPracticeIntent('learn')).toBe(true);
    expect(isPracticeIntent('')).toBe(false);
    expect(isPracticeIntent('hacker')).toBe(false);
  });
});

describe('EXPERIENCE_LEVELS', () => {
  it('covers fresher through senior', () => {
    expect(EXPERIENCE_LEVELS.map((l) => l.id)).toEqual(['fresher', 'sde1', 'sde2', 'senior']);
  });

  it('every level has label and description', () => {
    for (const level of EXPERIENCE_LEVELS) {
      expect(level.label.length).toBeGreaterThan(0);
      expect(level.description.length).toBeGreaterThan(0);
    }
  });
});

describe('isExperienceLevel', () => {
  it('accepts known ids and rejects unknowns', () => {
    expect(isExperienceLevel('fresher')).toBe(true);
    expect(isExperienceLevel('sde1')).toBe(true);
    expect(isExperienceLevel('sde2')).toBe(true);
    expect(isExperienceLevel('senior')).toBe(true);
    expect(isExperienceLevel('')).toBe(false);
    expect(isExperienceLevel('staff')).toBe(false);
  });
});
