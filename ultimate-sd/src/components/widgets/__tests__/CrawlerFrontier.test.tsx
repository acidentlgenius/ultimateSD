import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import CrawlerFrontier from '../CrawlerFrontier';

describe('CrawlerFrontier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears timeouts on unmount to prevent memory leaks', async () => {
    // Instead of relying purely on timer count, let's spy on setState if we could,
    // but the timer count reduction is a solid proof since we explicitly check it.
    const { unmount } = render(<CrawlerFrontier />);

    const startButton = screen.getByText(/Add Seed URL/i);
    act(() => {
      fireEvent.click(startButton);
    });

    act(() => {
      vi.advanceTimersByTime(1000); // Trigger setInterval which calls setTimeout
    });

    // Check we have timers running
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    const countBeforeUnmount = vi.getTimerCount();

    unmount();

    // Verify timers were cleaned up
    expect(vi.getTimerCount()).toBeLessThan(countBeforeUnmount);

    // We can also ensure advancing time now does not throw errors
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });

  it('runs the crawler interval consistently without resetting on state changes (interval starvation fix)', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    render(<CrawlerFrontier />);

    // The interval should be created exactly once on mount (or twice in strict mode, but we just want to ensure it doesn't get cleared/recreated repeatedly)
    const initialIntervalCount = setIntervalSpy.mock.calls.length;
    const initialClearCount = clearIntervalSpy.mock.calls.length;

    const startButton = screen.getByText(/Add Seed URL/i);
    act(() => {
      fireEvent.click(startButton); // Triggers state changes (queues length)
    });

    act(() => {
      fireEvent.click(startButton); // Triggers more state changes
    });

    // The bug was that the interval was cleared and recreated on state changes.
    // If the fix works, clearInterval should NOT have been called more times than initial (due to strict mode double mount),
    // and setInterval shouldn't have been called again.
    expect(clearIntervalSpy.mock.calls.length).toBe(initialClearCount);
    expect(setIntervalSpy.mock.calls.length).toBe(initialIntervalCount);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
