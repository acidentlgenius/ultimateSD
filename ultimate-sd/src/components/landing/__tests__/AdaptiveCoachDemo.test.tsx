import { render } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach, afterEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import '@testing-library/jest-dom';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing (regression test for react-hooks/refs)', () => {
    const { container } = render(<AdaptiveCoachDemo />);
    expect(container).toBeInTheDocument();
  });
});
