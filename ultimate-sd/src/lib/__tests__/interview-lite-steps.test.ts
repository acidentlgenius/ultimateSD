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

  it('returns the OOD generic template for oop-design tagged problems with no custom steps, regardless of difficulty', () => {
    const parkingLot = getPracticeSteps('design-parking-lot', 'Easy');
    expect(parkingLot.steps).toBe(GENERIC_OOD_PHASE_STEPS);
    expect(parkingLot.mode).toBe('full');

    const elevator = getPracticeSteps('design-elevator-system', 'Medium');
    expect(elevator.steps).toBe(GENERIC_OOD_PHASE_STEPS);
    expect(elevator.mode).toBe('full');
  });
});
