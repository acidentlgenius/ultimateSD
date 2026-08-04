// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  MockProbeOutputSchema,
  SessionDebriefOutputSchema,
} from '@/lib/adaptive-coach/skills/invoke';

describe('MockProbeOutputSchema', () => {
  it('accepts a valid probe question', () => {
    const result = MockProbeOutputSchema.safeParse({
      question: 'How do you handle a regional outage?',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty questions', () => {
    expect(MockProbeOutputSchema.safeParse({ question: '' }).success).toBe(false);
  });
});

describe('SessionDebriefOutputSchema', () => {
  it('accepts a valid debrief payload', () => {
    const result = SessionDebriefOutputSchema.safeParse({
      overallScore: 7,
      verdict: 'Hire',
      strengths: ['Clear requirements'],
      improvements: ['Weak trade-off analysis'],
      phaseNotes: [{ phase: 'HLD', comment: 'Solid component diagram.' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects scores outside 1–10', () => {
    expect(
      SessionDebriefOutputSchema.safeParse({
        overallScore: 0,
        verdict: 'No Hire',
        strengths: [],
        improvements: [],
        phaseNotes: [],
      }).success,
    ).toBe(false);
  });
});
