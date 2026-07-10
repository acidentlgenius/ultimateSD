import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import ElevatorDispatchSim from '../ElevatorDispatchSim';

describe('ElevatorDispatchSim', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances the simulation clock when started', () => {
    render(<ElevatorDispatchSim />);

    expect(screen.getByText(/Elevator Dispatch Simulator/i)).toBeTruthy();
    expect(screen.getByText(/0s \/ 60s/i)).toBeTruthy();

    // Switch to an automatic mode and start
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /SCAN\/LOOK/i }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^Start$/i }));
    });

    // 5 ticks at 400ms per tick = 5 simulated seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/5s \/ 60s/i)).toBeTruthy();
  });

  it('cleans up timers on unmount so nothing fires afterwards', () => {
    const { unmount } = render(<ElevatorDispatchSim />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /FCFS/i }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^Start$/i }));
    });

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    const countBeforeUnmount = vi.getTimerCount();

    unmount();

    expect(vi.getTimerCount()).toBeLessThan(countBeforeUnmount);

    // Advancing time after unmount must not throw (no leaked timers firing)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});
