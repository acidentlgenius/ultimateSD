import { describe, it, expect } from 'vitest';
import {
  getPracticeSteps,
  INTERVIEW_LITE_PHASE_STEPS,
  countPracticeSteps,
} from '../interview-lite-steps';
import { DEFAULT_PHASE_STEPS, GENERIC_OOD_PHASE_STEPS } from '../steps';

describe('getPracticeSteps', () => {
  it('uses custom steps when problem has a dedicated curriculum', () => {
    const result = getPracticeSteps('design-tinyurl', 'Easy');
    expect(result.mode).toBe('custom');
    expect(result.steps).not.toBe(INTERVIEW_LITE_PHASE_STEPS);
  });

  it('uses interview lite for Easy problems without custom steps', () => {
    const result = getPracticeSteps('design-nonexistent-slug-easy', 'Easy');
    expect(result.mode).toBe('lite');
    expect(result.steps).toBe(INTERVIEW_LITE_PHASE_STEPS);
    expect(countPracticeSteps(result.steps)).toBe(5);
  });

  it('uses full default template for Medium problems without custom steps', () => {
    const result = getPracticeSteps('design-nonexistent-slug', 'Medium');
    expect(result.mode).toBe('full');
    expect(result.steps).toBe(DEFAULT_PHASE_STEPS);
    expect(countPracticeSteps(result.steps)).toBeGreaterThan(5);
  });

  it('interview lite skips LLD and scalability phases', () => {
    expect(INTERVIEW_LITE_PHASE_STEPS.lld).toBeUndefined();
    expect(INTERVIEW_LITE_PHASE_STEPS.scalability).toBeUndefined();
    expect(Object.keys(INTERVIEW_LITE_PHASE_STEPS)).toEqual([
      'requirements',
      'hld',
      'tradeoffs',
    ]);
  });

  it('bespoke curricula outrank the OOD generic template (parking lot, elevator)', () => {
    const parkingLot = getPracticeSteps('design-parking-lot', 'Easy');
    expect(parkingLot.mode).toBe('custom');
    expect(parkingLot.steps).not.toBe(GENERIC_OOD_PHASE_STEPS);

    const elevator = getPracticeSteps('design-elevator-system', 'Easy');
    expect(elevator.mode).toBe('custom');
    expect(elevator.steps).not.toBe(GENERIC_OOD_PHASE_STEPS);
  });
});
