import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import PrivacyRequestManager from '../PrivacyRequestManager';
import React from 'react';
import * as sonner from 'sonner';

// Mock matchMedia for Radix UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        info: vi.fn()
    }
}));

describe('PrivacyRequestManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('cleans up timeouts when unmounted during execution', () => {
        const { unmount } = render(<PrivacyRequestManager />);

        // Find and click the locate button to enter ready state
        const locateBtn = screen.getByText(/Locate User Data/i);
        fireEvent.click(locateBtn);

        act(() => {
            // Fast forward past the interval
            vi.advanceTimersByTime(2500);
        });

        // Now we should be in ready state, find the purge button
        const purgeBtn = screen.getByText(/Purge All Data/i);
        fireEvent.click(purgeBtn);

        // Advance timers a little bit so timeouts are registered
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Unmount the component while timeouts are still pending
        unmount();

        // Advance the remaining timers
        act(() => {
            vi.runAllTimers();
        });

        // With memory leak, sonner.toast.success is still called
        // if fixed, it shouldn't be called
        expect(sonner.toast.success).not.toHaveBeenCalled();
    });
});
