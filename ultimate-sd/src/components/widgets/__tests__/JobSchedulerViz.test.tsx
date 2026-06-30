import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import JobSchedulerViz from '../JobSchedulerViz';

describe('JobSchedulerViz', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears timeouts on unmount to prevent memory leaks', async () => {
    const { unmount } = render(<JobSchedulerViz />);

    // Start the job
    const startButton = screen.getByText(/Start Job/i);
    act(() => {
      startButton.click();
    });

    // Advance by 1 second to let interval trigger setTimeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // There should be timers from the setTimeout
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    const countBeforeUnmount = vi.getTimerCount();

    // Unmount the component
    unmount();

    expect(vi.getTimerCount()).toBeLessThan(countBeforeUnmount);
  });

  it('completes tasks', async () => {
    render(<JobSchedulerViz />);

    const startButton = screen.getByText(/Start Job/i);
    act(() => {
      startButton.click();
    });

    for (let i = 0; i < 20; i++) {
        act(() => {
            vi.advanceTimersByTime(2000);
        });
    }

    // Wait for tasks to complete
    const completedTasks = screen.queryAllByText(/COMPLETED/i);
    expect(completedTasks.length).toBeGreaterThanOrEqual(5);
  });
});
