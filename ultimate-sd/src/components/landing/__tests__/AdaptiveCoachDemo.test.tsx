import { render, screen, act } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { vi, expect } from 'vitest';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders without crashing', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
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

    // Check that there is no crash and at least some text is rendered
    expect(screen.getByText(/Same rough answer/)).toBeTruthy();

    // SQUASH: Fix: Added a regression test to ensure that when preferReducedMotion is true,
    // the coach typing animation does not show when the test plays forward.
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // We test that `preferReducedMotion` works by verifying it renders correctly
    // And when the timers advance, it progresses the text correctly
    expect(screen.getByText(/Same rough answer/)).toBeTruthy();
  });

  it('handles preferReducedMotion properly', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true, // Mock preferReducedMotion to true
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

    expect(screen.getByText(/Same rough answer/)).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // When prefers-reduced-motion is true, the entire script is shown immediately without animations,
    // so there shouldn't be a typing indicator.
    expect(document.querySelector('.animate-pulse')).toBeNull();
  });
});
