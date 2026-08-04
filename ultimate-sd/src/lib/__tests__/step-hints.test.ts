import { describe, expect, it } from 'vitest';
import { getStepInteractionHint } from '@/lib/step-hints';
import type { StepData } from '@/types';

const step = (overrides: Partial<StepData>): StepData => ({
  phase: 'Requirements',
  subStep: 'functional',
  title: 'T',
  prompt: 'P',
  inputType: 'list',
  ...overrides,
});

describe('getStepInteractionHint', () => {
  it('returns a hint for every input type', () => {
    for (const inputType of ['list', 'textarea', 'schema'] as const) {
      const hint = getStepInteractionHint(step({ inputType }));
      expect(hint, inputType).toBeTruthy();
    }
  });

  it('prefers an authored interactionHint', () => {
    expect(getStepInteractionHint(step({ interactionHint: 'Custom hint.' }))).toBe('Custom hint.');
  });

  it('returns null for diagram sub-steps (the canvas indicator already guides)', () => {
    expect(getStepInteractionHint(step({ subStep: 'high-level' }))).toBeNull();
  });

  it('an authored hint wins even on diagram sub-steps', () => {
    expect(
      getStepInteractionHint(step({ subStep: 'high-level', interactionHint: 'Draw it this way.' }))
    ).toBe('Draw it this way.');
  });
});
