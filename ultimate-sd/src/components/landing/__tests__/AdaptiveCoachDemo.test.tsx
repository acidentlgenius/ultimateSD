import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { act } from '@testing-library/react';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
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
  });

  it('renders without crashing', async () => {
    let result;
    await act(async () => {
        result = render(<AdaptiveCoachDemo />);
    });
    expect(result.container).toBeDefined();
  });
});
