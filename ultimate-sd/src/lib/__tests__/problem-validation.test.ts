import { describe, expect, it } from 'vitest';
import type { SystemDesignProblem } from '@/types';
import { validateProblem } from '../problem-validation';

function makeProblem(overrides: Partial<SystemDesignProblem> = {}): SystemDesignProblem {
  return {
    id: '999',
    title: 'Design Widget',
    slug: 'design-widget',
    context: 'A widget system.',
    functionalRequirements: ['X'],
    nonFunctionalRequirements: [],
    difficulty: 'Easy',
    category: 'Basics',
    companies: [],
    ...overrides,
  };
}

describe('validateProblem', () => {
  it('flags a sparse context and empty non-functional requirements', () => {
    const result = validateProblem(makeProblem());
    expect(result.contentErrors.length).toBeGreaterThan(0);
    expect(result.contentErrors.some((e) => e.includes('context'))).toBe(true);
    expect(result.contentErrors.some((e) => e.includes('nonFunctionalRequirements'))).toBe(true);
  });

  it('passes content checks when context and requirements are substantial', () => {
    const result = validateProblem(
      makeProblem({
        context:
          'Users need to reserve a widget slot online. The system must handle bursts of traffic during flash sales.',
        functionalRequirements: ['Users can reserve a widget slot for a specific time window'],
        nonFunctionalRequirements: ['Support 10K concurrent reservations with <200ms p99 latency'],
      })
    );
    expect(result.contentErrors).toEqual([]);
  });

  it('always reports zero missing phases because the resolved steps are backfilled', () => {
    const result = validateProblem(makeProblem());
    expect(result.missingPhases).toEqual([]);
  });
});
