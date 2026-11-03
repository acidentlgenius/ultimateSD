import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import React from 'react';

const matchMediaMock = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

const rafMock = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
  return setTimeout(() => cb(performance.now()), 16) as any;
});
const cafMock = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
  clearTimeout(id as any);
});

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('respects prefers-reduced-motion immediately on mount', async () => {
    // Set reduced motion to true
    matchMediaMock.mockImplementationOnce(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    await act(async () => {
      render(<AdaptiveCoachDemo />);
    });

    // Check if the typing indicator is visible (should be null since all beats are rendered instantly with reduced motion)
    expect(screen.queryByText('Coach is typing…')).toBeNull();
  });
});
