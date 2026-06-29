import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import CrawlerFrontier from '../CrawlerFrontier';
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

describe('CrawlerFrontier', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('has memory leak from unmounted component', () => {
        const { unmount } = render(<CrawlerFrontier />);

        // Find and click the start button
        const startBtn = screen.getByText(/Add Seed URL/i);
        fireEvent.click(startBtn);

        // Advance timers so items are processed and timeouts are registered
        act(() => {
            vi.advanceTimersByTime(2100);
        });

        expect(vi.getTimerCount()).toBeGreaterThan(0);

        // Unmount the component while timeouts are still pending
        unmount();

        expect(vi.getTimerCount()).toBeGreaterThan(0);
    });
});
