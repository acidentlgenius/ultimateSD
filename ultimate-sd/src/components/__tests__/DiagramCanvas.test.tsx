import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DiagramCanvas from '../DiagramCanvas';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock getContext
const mockCtx = {
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  setLineDash: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
};

describe('DiagramCanvas', () => {
  let getContextMock: any;

  beforeEach(() => {
    // Mock getContext
    getContextMock = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockCtx as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<DiagramCanvas stepKey="test-step" />);
    expect(container.querySelector('canvas')).toBeDefined();
  });

  it('draws the grid using batched paths', () => {
     render(<DiagramCanvas stepKey="test-step" />);

     // Check that getContext was called
     expect(getContextMock).toHaveBeenCalled();

     // With empty elements, redraw() calls drawGrid()
     // drawGrid calls stroke() exactly once for the whole grid
     // React Strict Mode might run effects twice, so we allow for a few calls,
     // but definitely not ~160 (which would happen without optimization)
     expect(mockCtx.stroke.mock.calls.length).toBeLessThan(10);

     // Verify that we are indeed drawing many lines (moveTo/lineTo)
     // Canvas size is 2000x1200, grid size 20.
     // 2000/20 = 100 vertical lines
     // 1200/20 = 60 horizontal lines
     // Total ~160 lines per drawGrid call.
     expect(mockCtx.moveTo.mock.calls.length).toBeGreaterThan(100);
     expect(mockCtx.lineTo.mock.calls.length).toBeGreaterThan(100);
  });
});
