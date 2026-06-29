import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RAGArchitect from '../RAGArchitect';
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

describe('RAGArchitect', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('has memory leak from unmounted component', () => {
        const { unmount, container } = render(<RAGArchitect />);

        // Find and click the Submit Query button
        const input = container.querySelector('input');
        if (input) {
            fireEvent.change(input, { target: { value: 'Test query' } });
        }

        const startBtn = screen.getByText(/Ask AI/i);
        fireEvent.click(startBtn);

        // Submit query schedules timeouts
        expect(vi.getTimerCount()).toBeGreaterThan(0);

        unmount();

        // Timers should still be pending due to memory leak
        expect(vi.getTimerCount()).toBeGreaterThan(0);
    });
});
