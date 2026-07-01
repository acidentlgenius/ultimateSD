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
});
