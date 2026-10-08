import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import '@testing-library/jest-dom';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(() => cb(performance.now()), 16) as any);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => clearTimeout(id as any));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('handles prefers-reduced-motion correctly and mounts without crashing', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await act(async () => {
      render(<AdaptiveCoachDemo />);
    });

    // Test logic verifies no runtime crash
    expect(screen.getByText(/Same rough answer./i)).toBeInTheDocument();
  });
});
