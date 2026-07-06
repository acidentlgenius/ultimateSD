import { render, screen, act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MessageQueueVisualizer from '@/components/widgets/MessageQueueVisualizer';

describe('MessageQueueVisualizer starvation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('consumers still read messages even if new messages are published rapidly', () => {
    render(<MessageQueueVisualizer />);

    const publishButton = screen.getByRole('button', { name: /Publish Msg/i });

    // Total time: 10 * 300 = 3000ms.
    for (let i = 0; i < 10; i++) {
        act(() => {
            vi.advanceTimersByTime(300);
            fireEvent.click(publishButton);
        });
    }

    const textContent = document.body.textContent || '';
    const hasAdvanced = textContent.includes('Offset: 1') || textContent.includes('Offset: 2') || textContent.includes('Offset: 3') || textContent.includes('Offset: 4');

    expect(hasAdvanced).toBe(true);
  });
});
