import { render } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<AdaptiveCoachDemo />);
    expect(container).toBeDefined();
  });
});
