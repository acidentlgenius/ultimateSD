import { describe, expect, it } from 'vitest';
import {
  DEMO_SCORE,
  createInitialDemoState,
  resetDemoState,
  submitDemoAttempt,
} from '@/lib/adaptive-coach/demo/landing-demo';

describe('landing demo orchestration', () => {
  it('uses fixed score 5', () => {
    expect(DEMO_SCORE).toBe(5);
  });

  it('fresher passes on first submit', () => {
    let state = createInitialDemoState('fresher');
    state = submitDemoAttempt(state);
    expect(state.attempts).toBe(1);
    expect(state.lastAction).toBe('pass');
    expect(state.done).toBe(true);
    expect(state.messages.at(-1)?.kind).toBe('pass');
  });

  it('senior retries then teach_forwards on attempt 2', () => {
    let state = createInitialDemoState('senior');
    state = submitDemoAttempt(state);
    expect(state.lastAction).toBe('retry');
    expect(state.done).toBe(false);
    state = submitDemoAttempt(state);
    expect(state.attempts).toBe(2);
    expect(state.lastAction).toBe('teach_forward');
    expect(state.done).toBe(true);
    expect(state.messages.at(-1)?.kind).toBe('teach_forward');
    expect(state.messages.at(-1)?.body).toMatch(/functional|non-functional|requirements/i);
  });

  it('sde1 teach_forwards on third attempt', () => {
    let state = createInitialDemoState('sde1');
    state = submitDemoAttempt(state);
    expect(state.lastAction).toBe('retry');
    state = submitDemoAttempt(state);
    expect(state.lastAction).toBe('retry');
    state = submitDemoAttempt(state);
    expect(state.attempts).toBe(3);
    expect(state.lastAction).toBe('teach_forward');
    expect(state.done).toBe(true);
  });

  it('ignores submit when already done', () => {
    let state = createInitialDemoState('fresher');
    state = submitDemoAttempt(state);
    const frozen = state;
    state = submitDemoAttempt(state);
    expect(state).toEqual(frozen);
  });

  it('resetDemoState clears progress for a new level', () => {
    let state = createInitialDemoState('senior');
    state = submitDemoAttempt(state);
    state = resetDemoState('fresher');
    expect(state.level).toBe('fresher');
    expect(state.attempts).toBe(0);
    expect(state.done).toBe(false);
    expect(state.lastAction).toBeNull();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('system');
  });
});
