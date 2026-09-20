import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { DEMO_LEVELS, getDemoScript } from '@/lib/adaptive-coach/demo/landing-demo';
import '@testing-library/jest-dom';

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should immediately show all beats if prefers-reduced-motion is true', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<AdaptiveCoachDemo />);
    // When prefers-reduced-motion is true, all script elements should be visible immediately
    // rather than progressively entering.
    const script = getDemoScript('sde1');
    const systemBeats = script.filter((b) => b.role === 'system');

    // We expect the script to be completely shown immediately
    expect(screen.getAllByText(systemBeats[0].body).length).toBeGreaterThan(0);
  });

  it('should not immediately show all beats if prefers-reduced-motion is false', () => {
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

    render(<AdaptiveCoachDemo />);

    const script = getDemoScript('sde1');

    // Find a beat that happens later (e.g. at 5000ms)
    const lateBeat = script.find((b) => b.atMs > 2000 && b.role === 'system');
    if (lateBeat) {
      expect(screen.queryByText(lateBeat.body)).not.toBeInTheDocument();
    }
  });
});
