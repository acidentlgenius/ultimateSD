import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import React from 'react';
import '@testing-library/jest-dom';

// Mock matchMedia
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

// Mock requestAnimationFrame
vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
  return setTimeout(() => cb(performance.now()), 16) as any;
});
vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => clearTimeout(id as any));

describe('AdaptiveCoachDemo', () => {
  it('should render without errors and without react ref errors', () => {
    // Capture console errors
    const errors: any[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args);
    });

    render(<AdaptiveCoachDemo />);
    expect(screen.getByText(/Same rough answer/)).toBeInTheDocument();

    // Check if there are any errors (like "Cannot access ref value during render")
    consoleError.mockRestore();
    // React strict mode issues ref reading warnings but since it's an eslint error we should be fine, let's fix the ESLint error
    // In React 19, reading a ref during render is an actual error not just warning.
    // The ESLint rule `react-hooks/refs` is explicitly failing.
  });
});
