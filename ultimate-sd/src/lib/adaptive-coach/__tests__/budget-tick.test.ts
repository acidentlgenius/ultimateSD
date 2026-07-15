import { describe, expect, it } from 'vitest';
import { budgetTick } from '@/lib/adaptive-coach/tools/budget-tick';

describe('budgetTick', () => {
  it('does not warn or end mock in practice with plenty of time', () => {
    expect(budgetTick({ mode: 'practice', sessionRemainingSec: 600 })).toEqual({
      warn: false,
      endMock: false,
    });
  });

  it('warns in practice when five minutes or less remain', () => {
    expect(budgetTick({ mode: 'practice', sessionRemainingSec: 300 })).toEqual({
      warn: true,
      endMock: false,
    });
    expect(budgetTick({ mode: 'practice', sessionRemainingSec: 60 })).toEqual({
      warn: true,
      endMock: false,
    });
  });

  it('does not end mock in practice even at zero', () => {
    expect(budgetTick({ mode: 'practice', sessionRemainingSec: 0 })).toEqual({
      warn: true,
      endMock: false,
    });
  });

  it('ends mock when session budget hits zero', () => {
    expect(budgetTick({ mode: 'mock', sessionRemainingSec: 0 })).toEqual({
      warn: false,
      endMock: true,
    });
    expect(budgetTick({ mode: 'mock', sessionRemainingSec: -10 })).toEqual({
      warn: false,
      endMock: true,
    });
  });

  it('does not warn or end mock in mock with time remaining', () => {
    expect(budgetTick({ mode: 'mock', sessionRemainingSec: 120 })).toEqual({
      warn: false,
      endMock: false,
    });
  });
});
