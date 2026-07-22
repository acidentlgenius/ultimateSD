import { render, act, screen, fireEvent } from '@testing-library/react';
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

  it('does not recreate the interval on every tick (interval starvation bug)', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    render(
      <TimerWidget
        initialTimeSeconds={10}
        problemId="interval-starvation-test"
      />
    );

    // Initial render might trigger one setInterval (since problemId auto-starts)
    const initialCalls = setIntervalSpy.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // The interval should not have been cleared and recreated 5 times
    expect(setIntervalSpy.mock.calls.length).toBe(initialCalls);
  });

  it('does not fire onComplete a second time when Play is clicked again after expiry', () => {
    const onComplete = vi.fn();
    render(
      <TimerWidget
        initialTimeSeconds={2}
        problemId="interview-lite-p2"
        onComplete={onComplete}
      />
    );

    // Let the countdown reach zero and fire onComplete once.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Clicking the (now Play) button again should not restart the timer
    // and re-trigger onComplete, since timeLeft is already 0.
    const playButton = screen.getByRole('button', { name: /start timer/i });
    act(() => {
      fireEvent.click(playButton);
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
