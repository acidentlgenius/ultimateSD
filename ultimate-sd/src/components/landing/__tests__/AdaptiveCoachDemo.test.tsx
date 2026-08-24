import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/chat/CoachBubble', () => ({
  CoachBubble: ({ children, role }: any) => (
    <div data-testid={`bubble-${role}`}>{children}</div>
  ),
}));

describe('AdaptiveCoachDemo', () => {
  it('renders without throwing when matches is called', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
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
    expect(screen.getByText(/Same rough answer/)).toBeDefined();
  });
});
