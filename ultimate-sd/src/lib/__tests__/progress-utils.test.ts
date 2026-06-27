// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  countTotalSteps,
  computeProgressPercent,
  deriveDisplayStatus,
  parseStepPhase,
} from '@/lib/progress-utils';

describe('countTotalSteps', () => {
  it('sums steps across all phases', () => {
    const steps = { requirements: [{}, {}], hld: [{}] } as Record<string, unknown[]>;
    expect(countTotalSteps(steps)).toBe(3);
  });
});

describe('computeProgressPercent', () => {
  it('returns 0 when no steps passed', () => {
    expect(computeProgressPercent([], 8)).toBe(0);
  });
  it('returns rounded percentage', () => {
    expect(computeProgressPercent(['requirements-0', 'requirements-1'], 8)).toBe(25);
  });
});

describe('deriveDisplayStatus', () => {
  const now = new Date('2026-06-27T12:00:00Z');

  it('returns NOT_STARTED when no sessions', () => {
    expect(deriveDisplayStatus({ sessions: [], summaryStatus: 'NOT_STARTED' }, now)).toBe('NOT_STARTED');
  });
  it('promotes COMPLETED to REVIEW_NEEDED when SRS date passed', () => {
    expect(
      deriveDisplayStatus({
        sessions: [{ status: 'COMPLETED' }],
        summaryStatus: 'COMPLETED',
        nextRepetitionDate: new Date('2026-06-01'),
      }, now)
    ).toBe('REVIEW_NEEDED');
  });
  it('returns IN_PROGRESS for active session', () => {
    expect(
      deriveDisplayStatus({
        sessions: [{ status: 'ACTIVE' }],
        summaryStatus: 'IN_PROGRESS',
      }, now)
    ).toBe('IN_PROGRESS');
  });
});

describe('parseStepPhase', () => {
  it('extracts phase from step key', () => {
    expect(parseStepPhase('requirements-0')).toBe('requirements');
  });
});
