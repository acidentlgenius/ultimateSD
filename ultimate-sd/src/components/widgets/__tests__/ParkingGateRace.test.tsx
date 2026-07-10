import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import ParkingGateRace from '../ParkingGateRace';

describe('ParkingGateRace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets the user cause a double-booking by interleaving gate operations', () => {
    render(<ParkingGateRace />);

    expect(screen.getByText(/Parking Gate Race/i)).toBeTruthy();

    const gateA = () => screen.getByRole('button', { name: /Gate A: run/i });
    const gateB = () => screen.getByRole('button', { name: /Gate B: run/i });

    // The bad interleaving: A READ, B READ, A PICK, B PICK, A WRITE, B WRITE
    act(() => { fireEvent.click(gateA()); }); // A READ
    act(() => { fireEvent.click(gateB()); }); // B READ (sees same free spot)
    act(() => { fireEvent.click(gateA()); }); // A PICK
    act(() => { fireEvent.click(gateB()); }); // B PICK
    act(() => { fireEvent.click(gateA()); }); // A WRITE
    act(() => { fireEvent.click(gateB()); }); // B WRITE -> collision

    expect(screen.getAllByText(/Double-booked/i).length).toBeGreaterThan(0);
  });

  it('runs the naive auto simulation and cleans up timers on unmount', () => {
    const { unmount } = render(<ParkingGateRace />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Naive \(auto\)/i }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Simulation interval is running
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
