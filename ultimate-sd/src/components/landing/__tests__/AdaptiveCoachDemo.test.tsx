import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';

describe('AdaptiveCoachDemo', () => {
  it('renders without crashing when prefers-reduced-motion is true', () => {
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

    expect(() => render(<AdaptiveCoachDemo />)).not.toThrow();
  });

  it('renders without crashing when prefers-reduced-motion is false', () => {
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

    expect(() => render(<AdaptiveCoachDemo />)).not.toThrow();
  });
});
