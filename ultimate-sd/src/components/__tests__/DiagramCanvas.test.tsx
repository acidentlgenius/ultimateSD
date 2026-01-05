import React from 'react';
import { render, screen } from '@testing-library/react';
import DiagramCanvas from '../DiagramCanvas';
import { vi, describe, it, expect, beforeAll } from 'vitest';
import '@testing-library/jest-dom';

// Mock canvas getContext
const mockGetContext = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  setLineDash: vi.fn(),
  strokeRect: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  quadraticCurveTo: vi.fn(),
}));

// Mock Portal for DiagramName section
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock matchMedia
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

describe('DiagramCanvas', () => {
  beforeAll(() => {
    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = mockGetContext as any;
  });

  it('renders without crashing', () => {
    render(<DiagramCanvas stepKey="test-step" />);
    // Since it's a canvas, we mainly check if the component mounts.
    // The "System Design Diagram" text is in the header.
    expect(screen.getByText('System Design Diagram')).toBeInTheDocument();
  });
});
