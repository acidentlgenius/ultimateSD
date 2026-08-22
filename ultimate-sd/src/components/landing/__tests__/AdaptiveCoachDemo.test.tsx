import { render, screen } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { expect, test, vi, describe, beforeEach, afterEach } from 'vitest';

describe('AdaptiveCoachDemo', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    // Mock matchMedia
    matchMediaMock = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('respects prefers-reduced-motion and does not animate on mount', () => {
    // If the bug (useRef) was present, the component would render initially assuming preferReducedMotion is false,
    // and would NOT re-render when the useEffect ran to check the media query.
    // We can verify that it actually renders the full script if reduced motion is respected.
    render(<AdaptiveCoachDemo />);

    // With reduced motion true, all script elements (Coach is typing, or actual text bubbles) might render immediately.
    // Let's verify something about the state. If reduced motion is true, the full script is visible immediately.
    const text = screen.getByText('Solid start — but you\'re blending what the product does with how well it has to run. Split functional needs from the performance bar.');
    expect(text).toBeDefined();
    expect(text.tagName).toBeDefined();
  });
});
