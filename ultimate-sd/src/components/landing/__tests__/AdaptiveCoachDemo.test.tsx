import { render, screen } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';

beforeEach(() => {
  vi.clearAllMocks();

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
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
});

test('AdaptiveCoachDemo renders without crashing', () => {
  render(<AdaptiveCoachDemo />);
  expect(screen.getByText(/Same rough answer/i)).toBeDefined();
});

test('AdaptiveCoachDemo respects prefers-reduced-motion', () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: true, // Simulate reduced motion
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  render(<AdaptiveCoachDemo />);
  // If reduced motion is true, the play button shouldn't exist because it auto-finishes
  // or rather, it should say "Replay" immediately because it fast-forwards.
  expect(screen.getAllByText('Replay').length).toBeGreaterThan(0);
});
