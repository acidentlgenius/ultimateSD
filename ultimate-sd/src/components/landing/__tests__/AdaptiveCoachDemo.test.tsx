import { render, screen, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import React from 'react';

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: matches && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
  };
});

describe('AdaptiveCoachDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('handles prefers-reduced-motion correctly', async () => {
    mockMatchMedia(true);

    await act(async () => {
      render(<AdaptiveCoachDemo />);
    });

    const heading = screen.getByText(/Same rough answer/i);
    expect(heading).toBeDefined();

    // Check that there's no runtime error accessing ref during render
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('handles prefers-reduced-motion: false correctly', async () => {
    mockMatchMedia(false);

    await act(async () => {
      render(<AdaptiveCoachDemo />);
    });

    const heading = screen.getByText(/Same rough answer/i);
    expect(heading).toBeDefined();
  });
});
