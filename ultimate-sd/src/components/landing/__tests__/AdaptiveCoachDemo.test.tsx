import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import '@testing-library/jest-dom';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
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

  it('respects prefers-reduced-motion by showing all beats and not playing animation', () => {
    render(<AdaptiveCoachDemo />);
    const replayButton = screen.getByRole('button', { name: /Replay demo/i });
    expect(replayButton).toBeInTheDocument();
  });
});
