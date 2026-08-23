import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';

vi.mock('@/components/chat/CoachBubble', () => ({
  CoachBubble: ({ children, role }: any) => <div data-testid={`bubble-${role}`}>{children}</div>,
}));

vi.mock('@/lib/adaptive-coach/demo/landing-demo', () => ({
  DEMO_LEVELS: [
    { id: 'fresher', label: 'Fresher' },
    { id: 'sde1', label: 'SDE-1' },
  ],
  DEMO_PROBLEM_LABEL: 'Demo Problem',
  getDemoScript: vi.fn().mockReturnValue([
    { id: '1', role: 'coach', body: 'Hello', atMs: 0 },
  ]),
  scriptDurationMs: vi.fn().mockReturnValue(1000),
  visibleBeats: vi.fn().mockReturnValue([
    { id: '1', role: 'coach', body: 'Hello', atMs: 0 },
  ]),
}));

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with reduced motion preference (regression test)', () => {
    // Mock reduced motion preference to true, which triggers the bug on mount if using ref
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

    // The test asserts that the component doesn't throw `Cannot access refs during render`
    render(<AdaptiveCoachDemo />);

    // Expect to render bubble
    expect(screen.getByTestId('bubble-coach')).toBeDefined();

    // Reset window
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
      })),
    });
  });
});
