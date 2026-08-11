import { render, screen } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

describe('AdaptiveCoachDemo', () => {
  it('renders without crashing and reacts to reduced motion media query', () => {
    // Mock matchMedia
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

    render(<AdaptiveCoachDemo />);
    expect(screen.getByText(/Same rough answer/i)).toBeInTheDocument();
  });
});
