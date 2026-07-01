import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import JobSchedulerViz from '../JobSchedulerViz';

describe('JobSchedulerViz', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes tasks without prematurely clearing timeouts on re-renders', async () => {
    render(<JobSchedulerViz />);

    const startButton = screen.getByText(/Start Job/i);
    act(() => {
      fireEvent.click(startButton);
    });

    // Advance time to allow assignment
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Advance time to allow task completion (Extract Data takes 2000ms)
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // We should see it completed
    expect(screen.getByText(/Task completed: Extract Data/i)).toBeTruthy();
  });
});
