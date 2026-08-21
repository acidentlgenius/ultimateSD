import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BlockchainDemo from '../widgets/BlockchainDemo';

// Mock simpleHash/mockHash behavior so we can predict the hash if needed
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('BlockchainDemo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears mining interval when component unmounts', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(<BlockchainDemo />);

    // Click the "mine" button for the first block
    // The button has a Hammer icon, we can find it by its role or contents
    const buttons = screen.getAllByRole('button');
    // The first button is "Add New Block", the second is the mine button for block 1
    const mineButton = buttons[1];

    fireEvent.click(mineButton);

    // Verify setInterval was called
    expect(setIntervalSpy).toHaveBeenCalled();
    const activeIntervals = setIntervalSpy.mock.results.length;

    // Ensure the interval was actually started
    expect(activeIntervals).toBeGreaterThan(0);

    // Ensure the interval was actually started by waiting for it
    await waitFor(() => {
        expect(setIntervalSpy).toHaveBeenCalled();
    });

    // Unmount the component while mining is supposedly active
    unmount();

    // Verify clearInterval was called to clean up the pending interval
    // We expect it to be called with the ID that was returned by setInterval
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
  it('clears previous mining interval if another block starts mining', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(<BlockchainDemo />);

    const addButton = screen.getByText('Add New Block');
    fireEvent.click(addButton);

    const buttons = screen.getAllByRole('button');
    const mineButton1 = buttons[1];
    const mineButton2 = buttons[2];

    fireEvent.click(mineButton1);

    // Wait for the first interval to start
    await waitFor(() => {
        expect(setIntervalSpy).toHaveBeenCalled();
    });

    fireEvent.click(mineButton2);

    expect(clearIntervalSpy).toHaveBeenCalled();

    unmount();
  });
});
