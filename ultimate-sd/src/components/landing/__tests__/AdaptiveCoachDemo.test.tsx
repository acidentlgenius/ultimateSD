import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import '@testing-library/jest-dom';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('respects prefers-reduced-motion by showing the final state without animation', () => {
    render(<AdaptiveCoachDemo />);

    // In reduced motion, playing should be false (so it says "Replay" instead of "Pause")
    expect(screen.getByRole('button', { name: 'Replay demo' })).toBeInTheDocument();
  });
});
