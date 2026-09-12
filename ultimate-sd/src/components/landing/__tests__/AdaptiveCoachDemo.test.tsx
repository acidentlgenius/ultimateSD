import { render } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Need to mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        // execute later
        return setTimeout(() => cb(performance.now()), 16) as any;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        clearTimeout(id as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<AdaptiveCoachDemo />);
  });
});
