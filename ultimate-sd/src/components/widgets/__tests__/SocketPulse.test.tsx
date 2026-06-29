import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import SocketPulse from '../SocketPulse';
import React from 'react';

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

describe('SocketPulse', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('has memory leak from unmounted component', () => {
        const { unmount } = render(<SocketPulse />);

        // Find and click the connect button
        const startBtn = screen.getByText(/Connect/i);
        fireEvent.click(startBtn);

        // Connect button schedules a timeout of 800ms
        // Unmount right away before it executes
        expect(vi.getTimerCount()).toBeGreaterThan(0);

        unmount();

        // Timer should still be pending due to memory leak
        expect(vi.getTimerCount()).toBeGreaterThan(0);
    });
});
