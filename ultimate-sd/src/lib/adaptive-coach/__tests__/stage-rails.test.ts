import { describe, expect, it } from 'vitest';
import { countPracticeSteps, INTERVIEW_LITE_PHASE_STEPS } from '@/lib/interview-lite-steps';
import { getPracticeSteps } from '@/lib/interview-lite-steps';
import { buildStageRails, canSkipStage } from '@/lib/adaptive-coach/tools/stage-rails';

describe('buildStageRails', () => {
  it('returns non-empty rails for TinyURL Easy practice', () => {
    const rails = buildStageRails('design-tinyurl', 'Easy', 'sde1', 'practice');
    expect(rails.length).toBeGreaterThan(0);
    expect(rails[0].id).toMatch(/^.+-\d+$/);
    expect(rails[0]).toMatchObject({
      phaseKey: expect.any(String),
      phase: expect.any(String),
      title: expect.any(String),
      prompt: expect.any(String),
      budgetSec: expect.any(Number),
    });
  });

  it('uses custom practice steps for TinyURL Easy (not lite template)', () => {
    const customCount = countPracticeSteps(getPracticeSteps('design-tinyurl', 'Easy').steps);
    const rails = buildStageRails('design-tinyurl', 'Easy', 'sde1', 'practice');
    expect(rails.length).toBe(customCount);
    expect(rails[0].title).toBe('Functional Requirements');
  });

  it('uses compact interview-lite set for mock lite', () => {
    const liteCount = countPracticeSteps(INTERVIEW_LITE_PHASE_STEPS);
    const rails = buildStageRails('design-tinyurl', 'Easy', 'sde1', 'mock', 'lite');
    expect(rails.length).toBe(liteCount);
    expect(rails.length).toBe(5);
    expect(rails.map((s) => s.phaseKey)).toEqual([
      'requirements',
      'requirements',
      'hld',
      'hld',
      'tradeoffs',
    ]);
  });

  it('assigns per-stage budget from difficulty × level heuristic', () => {
    const rails = buildStageRails('design-tinyurl', 'Easy', 'fresher', 'practice');
    // Easy base 6 min × fresher 1.2 = 7.2 min = 432 sec
    expect(rails[0].budgetSec).toBe(432);

    const sde2Rails = buildStageRails('design-tinyurl', 'Medium', 'sde2', 'practice');
    // Medium base 8 min × sde2 0.9 = 7.2 min = 432 sec
    expect(sde2Rails[0].budgetSec).toBe(432);
  });
});

describe('canSkipStage', () => {
  it('allows skip when competency earned is high enough', () => {
    expect(canSkipStage('sde2', 0.85)).toBe(true);
  });

  it('denies skip when competency earned is below threshold', () => {
    expect(canSkipStage('sde2', 0.79)).toBe(false);
  });
});
