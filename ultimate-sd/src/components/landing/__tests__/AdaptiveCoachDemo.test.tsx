import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { act } from 'react';

// Mock getDemoScript so we don't need actual content
vi.mock('@/lib/adaptive-coach/demo/landing-demo', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getDemoScript: () => [
      { id: '1', role: 'coach', body: 'Hello', atMs: 0 },
      { id: '2', role: 'you', body: 'Hi', atMs: 1000 },
    ],
    scriptDurationMs: () => 1000,
  };
});

describe('AdaptiveCoachDemo', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = matchMediaMock;
  });

  it('renders without crashing', () => {
    render(<AdaptiveCoachDemo />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('handles prefers-reduced-motion correctly (regression test)', async () => {
    // SQUASH: We want to test that the component respects reduced motion by rendering the entire script immediately, and doesn't crash from accessing a ref during render.
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    }));

    await act(async () => {
      render(<AdaptiveCoachDemo />);
    });

    // Both coach and user lines should be visible because reduced motion shows everything immediately
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText('Hi')).toBeTruthy();
  });
});
