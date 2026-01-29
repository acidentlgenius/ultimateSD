import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import DiagramCanvas from '../DiagramCanvas';

// Mock Canvas API
// We need to mock getContext to prevent errors and potentially track calls
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  setLineDash: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  fillText: vi.fn(),
  ellipse: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  quadraticCurveTo: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  font: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
} as unknown as CanvasRenderingContext2D));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock createPortal to render children directly for testing
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('DiagramCanvas', () => {
  beforeEach(() => {
    // Setup portal container
    document.body.innerHTML = '<div id="design-name-portal"></div>';
  });

  it('renders without crashing', () => {
    const { container } = render(<DiagramCanvas stepKey="test-step" />);

    // Check if canvas is rendered
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();

    // We can also verify that getContext was called, implying drawing happened
    expect(canvas?.getContext).toHaveBeenCalled();
  });
});
