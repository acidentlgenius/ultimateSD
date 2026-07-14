import { render, screen, act, fireEvent } from '@testing-library/react';
import MessageQueueVisualizer from '../MessageQueueVisualizer';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MessageQueueVisualizer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        act(() => vi.runOnlyPendingTimers());
        vi.useRealTimers();
    });

    it('does not reset the interval timer when a new message is published', async () => {
        const setIntervalSpy = vi.spyOn(window, 'setInterval');
        const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

        render(<MessageQueueVisualizer />);

        const initialSetIntervalCalls = setIntervalSpy.mock.calls.length;
        const initialClearIntervalCalls = clearIntervalSpy.mock.calls.length;

        // Publish a message which updates state
        const publishButton = screen.getByRole('button', { name: /publish msg/i });

        act(() => {
            fireEvent.click(publishButton);
        });

        // This should NOT trigger a re-creation of the interval, which means clearInterval shouldn't be called right after
        expect(clearIntervalSpy).toHaveBeenCalledTimes(initialClearIntervalCalls);

        // And setInterval shouldn't be called again
        expect(setIntervalSpy).toHaveBeenCalledTimes(initialSetIntervalCalls);
    });
});
