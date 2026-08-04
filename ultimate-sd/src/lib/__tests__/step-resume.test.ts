import { describe, expect, it } from 'vitest';
import { canAdvancePastStep, findResumePosition } from '../step-resume';

const PHASES: Record<string, unknown[]> = {
  requirements: [{}, {}],       // requirements-0, requirements-1
  hld: [{}],                    // hld-0
  lld: [{}, {}],                // lld-0, lld-1
};

describe('canAdvancePastStep', () => {
  it('blocks forward when the step is neither completed nor skipped', () => {
    expect(canAdvancePastStep('requirements-0', new Set(), null)).toBe(false);
    expect(canAdvancePastStep('requirements-0', new Set(), { completed: false })).toBe(false);
  });

  it('allows forward after pass / completed', () => {
    expect(canAdvancePastStep('requirements-0', new Set(['requirements-0']), null)).toBe(true);
    expect(canAdvancePastStep('requirements-0', [], { completed: true })).toBe(true);
  });

  it('allows forward after explicit skip', () => {
    expect(canAdvancePastStep('requirements-0', new Set(), { skipped: true })).toBe(true);
  });
});

describe('findResumePosition', () => {
  it('starts at the first step when nothing is completed', () => {
    expect(findResumePosition(PHASES, new Set())).toEqual({ phase: 'requirements', stepIndex: 0 });
  });

  it('resumes at the step after the furthest completed one', () => {
    const completed = new Set(['requirements-0', 'requirements-1', 'hld-0']);
    expect(findResumePosition(PHASES, completed)).toEqual({ phase: 'lld', stepIndex: 0 });
  });

  it('does NOT drag the user back to a skipped step mid-run (regression)', () => {
    // Skipped requirements-1, completed hld-0 → must resume at lld-0, not requirements-1
    const completed = new Set(['requirements-0', 'hld-0']);
    expect(findResumePosition(PHASES, completed)).toEqual({ phase: 'lld', stepIndex: 0 });
  });

  it('circles back to the earliest skipped step once everything after it is done', () => {
    const completed = new Set(['requirements-0', 'hld-0', 'lld-0', 'lld-1']);
    expect(findResumePosition(PHASES, completed)).toEqual({ phase: 'requirements', stepIndex: 1 });
  });

  it('lands on the last step when everything is complete', () => {
    const completed = new Set(['requirements-0', 'requirements-1', 'hld-0', 'lld-0', 'lld-1']);
    expect(findResumePosition(PHASES, completed)).toEqual({ phase: 'lld', stepIndex: 1 });
  });

  it('handles empty phase maps without crashing', () => {
    expect(findResumePosition({}, new Set())).toEqual({ phase: 'requirements', stepIndex: 0 });
  });
});
