import { describe, expect, it } from 'vitest';
import { formatDebriefVariant, type StoredInterviewDebrief } from '@/lib/interview-debrief';

describe('formatDebriefVariant', () => {
  it('maps variant codes to user-facing labels', () => {
    expect(formatDebriefVariant('lite')).toBe('45-min Lite');
    expect(formatDebriefVariant('full')).toBe('60-min Full');
    expect(formatDebriefVariant('voice')).toBe('Voice');
  });
});

describe('StoredInterviewDebrief shape', () => {
  it('accepts a minimal debrief record', () => {
    const row: StoredInterviewDebrief = {
      id: 'd1',
      problemSlug: 'design-tinyurl',
      problemTitle: 'Design TinyURL',
      variant: 'lite',
      overallScore: 7,
      verdict: 'Hire',
      createdAt: new Date('2026-07-01'),
    };
    expect(row.problemSlug).toBe('design-tinyurl');
  });
});
