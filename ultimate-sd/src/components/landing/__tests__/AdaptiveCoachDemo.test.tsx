import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('@/components/chat/CoachBubble', () => ({
  CoachBubble: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
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

    const { getByText } = render(<AdaptiveCoachDemo />);
    expect(getByText(/Same rough answer/i)).toBeInTheDocument();
  });

  it('sets elapsedMs correctly when preferReducedMotion is true (regression test)', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: true, // Mock that user prefers reduced motion
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { getByText, queryByText } = render(<AdaptiveCoachDemo />);

    // In strict mode/proper behavior, elapsedMs immediately jumps to durationMs
    // which means showTyping should be false, and finished is true.
    // If there was a stale closure or we missed preferReducedMotion in deps,
    // "Coach is typing…" might briefly show or timers would still run.

    // Let the first effects run
    await vi.runAllTimersAsync();

    expect(queryByText('Coach is typing…')).not.toBeInTheDocument();
  });
});
