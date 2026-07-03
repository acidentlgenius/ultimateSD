import { describe, expect, it } from 'vitest';
import { PRACTICE_INTENTS, isPracticeIntent } from '@/lib/onboarding';

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
