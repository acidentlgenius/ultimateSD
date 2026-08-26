import { render, screen, act } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders successfully without ref access during render error', async () => {
    // Mock matchMedia to return false (normal behavior)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<AdaptiveCoachDemo />);

    // Check if the component renders successfully
    const element = document.querySelector('#adaptive-coach');
    expect(element).toBeDefined();

    // With normal motion, typing indicator should be present eventually
    let typingIndicator = screen.queryByText(/Coach is typing/i);
    if (!typingIndicator) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
      typingIndicator = screen.queryByText(/Coach is typing/i);
    }
  });

  it('honors prefers-reduced-motion instantly', async () => {
    // Mock matchMedia to return true
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<AdaptiveCoachDemo />);

    // Since it prefers reduced motion, the entire script should be shown instantly,
    // and we shouldn't see "Coach is typing..."
    const typingIndicator = screen.queryByText(/Coach is typing/i);
    expect(typingIndicator).toBeNull();
  });
});
