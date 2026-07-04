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

  it('processes queue items continuously without stale closures', () => {
    render(<CrawlerFrontier />);

    const startButton = screen.getByText(/Add Seed URL/i);

    // Add multiple seeds
    act(() => {
      fireEvent.click(startButton);
      fireEvent.click(startButton);
      fireEvent.click(startButton);
    });

    // Initial crawled count should be 0
    expect(screen.getByText(/Crawled: 0/i)).toBeDefined();

    // Advance timers in chunks to allow React state updates and intervals to tick
    // We expect it to process items. Each item takes ~1.5s to extract.
    // Advancing 10 seconds in 1s chunks should be enough to process a few.
    for (let i = 0; i < 15; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    // Crawled count should be greater than 0, proving the interval loop didn't get stuck
    // due to stale closures.
    const crawledBadge = screen.getByText(/Crawled: [1-9]/i);
    expect(crawledBadge).toBeDefined();
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
