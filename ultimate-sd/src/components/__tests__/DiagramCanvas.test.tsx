import React from 'react';
import { render } from '@testing-library/react';
import DiagramCanvas from '../DiagramCanvas';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
});

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contextMock: any;

  beforeEach(() => {
    contextMock = {
      strokeStyle: '',
      lineWidth: 0,
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      setLineDash: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      ellipse: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      quadraticCurveTo: vi.fn(),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(contextMock);

    // Mock getBoundingClientRect
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: 0, width: 2000, height: 1200, top: 0, left: 0, bottom: 0, right: 0, toJSON: () => {}
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<DiagramCanvas stepKey="test-step" />);
    // Since it's a canvas, we might not see text, but we can find the canvas element
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('draws grid efficiently', () => {
    render(<DiagramCanvas stepKey="test-step" />);

    // Default grid is on.
    // Width 2000, Height 1200. Grid size 20.
    // Horizontal lines: 1200/20 + 1 = 61
    // Vertical lines: 2000/20 + 1 = 101
    // Total lines = 162.
    // Optimized implementation batches calls.
    // Should be significantly fewer calls (1 per redraw).

    expect(contextMock.stroke).toHaveBeenCalled();
    const callCount = contextMock.stroke.mock.calls.length;
    console.log('Stroke call count:', callCount);
    expect(callCount).toBeLessThan(10);
  });
});
