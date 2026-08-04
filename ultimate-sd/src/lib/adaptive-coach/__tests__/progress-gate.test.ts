import { describe, expect, it } from 'vitest';
import { progressGate, getPassThreshold, getMaxAttempts } from '@/lib/adaptive-coach/tools/progress-gate';

describe('progressGate', () => {
  it('uses calibrated thresholds', () => {
    expect(getPassThreshold('practice', 'fresher')).toBe(5);
    expect(getPassThreshold('practice', 'sde1')).toBe(6);
    expect(getPassThreshold('mock', 'senior')).toBe(8);
    expect(getMaxAttempts('practice', 'sde1')).toBe(3);
    expect(getMaxAttempts('mock', 'sde2')).toBe(2);
  });

  it('ends mock when session time is exhausted', () => {
    const d = progressGate({
      mode: 'mock',
      level: 'sde1',
      score: 9,
      attempts: 0,
      stageElapsedSec: 0,
      stageBudgetSec: 600,
      sessionRemainingSec: 0,
    });
    expect(d.action).toBe('end_mock');
  });

  it('advance_budget in practice when stage budget elapsed', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 3,
      attempts: 1,
      stageElapsedSec: 601,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('advance_budget');
  });

  it('passes when score meets threshold', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 6,
      attempts: 1,
      stageElapsedSec: 10,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('pass');
  });

  it('retries when under threshold and attempts remain', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 4,
      attempts: 1,
      stageElapsedSec: 10,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('retry');
  });

  it('teach_forward when attempts exhausted', () => {
    const d = progressGate({
      mode: 'practice',
      level: 'sde1',
      score: 4,
      attempts: 3,
      stageElapsedSec: 10,
      stageBudgetSec: 600,
      sessionRemainingSec: 1000,
    });
    expect(d.action).toBe('teach_forward');
    expect(d.tipSkillId).toBe('teach-forward');
  });
});
