import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children }: any) => <div>{children}</div>,
  },
}));

vi.mock('next/link', () => ({
  default: ({ children }: any) => <a>{children}</a>,
}));

describe('AdaptiveCoachDemo', () => {
  it('renders correctly without throwing a ref error during StrictMode/linting checks', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true, // test preferReducedMotion
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(<AdaptiveCoachDemo />);
    expect(container).toBeTruthy();
  });
});
