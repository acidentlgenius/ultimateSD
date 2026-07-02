import { render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerWidget } from '@/components/TimerWidget';

describe('TimerWidget local-mode expiry', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onComplete when a local problemId countdown reaches zero', () => {
    const onComplete = vi.fn();
    render(
      <TimerWidget
        initialTimeSeconds={2}
        problemId="interview-lite-p1"
        onComplete={onComplete}
      />
    );

    // Local mode auto-starts when problemId is present; tick past zero.
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
