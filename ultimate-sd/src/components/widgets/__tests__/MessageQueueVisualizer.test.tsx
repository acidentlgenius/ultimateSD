import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import MessageQueueVisualizer from '../MessageQueueVisualizer';
import React from 'react';

describe('MessageQueueVisualizer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('should consume messages even when messages are published rapidly', async () => {
        render(<MessageQueueVisualizer />);
        const publishButton = screen.getByText('Publish Msg');

        // Publish 5 messages rapidly
        for (let i = 0; i < 5; i++) {
            await act(async () => {
                publishButton.click();
            });
            // Small advance to simulate rapid succession without hitting the 1s interval
            await act(async () => {
                vi.advanceTimersByTime(50);
            });
        }

        // Wait for the 1s interval to trigger
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        // The consumer offsets should increase, meaning consumers are processing.
        // Initially both C1 and C2 have offset 0. After 1s, they should have consumed some of the messages.
        const c1Element = screen.getByText(/C1 \(Offset:/);
        expect(c1Element.textContent).not.toContain('Offset: 0');
    });
});
