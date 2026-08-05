import { render, screen } from '@testing-library/react';
import { AdaptiveCoachDemo } from './AdaptiveCoachDemo';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>
}));

test('AdaptiveCoachDemo renders with animations enabled', async () => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  render(<AdaptiveCoachDemo />);
  expect(screen.getByText(/Same rough answer/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pause demo' })).toBeInTheDocument();
});

test('AdaptiveCoachDemo renders instantly with reduced motion', async () => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  render(<AdaptiveCoachDemo />);
  expect(screen.getByText(/Same rough answer/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Replay demo' })).toBeInTheDocument();
});
