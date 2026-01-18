import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import React from 'react';
import DiagramCanvas from '../DiagramCanvas';

// Mock dependencies
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('DiagramCanvas Performance', () => {
  let originalGetContext: unknown;
  let strokeMock: Mock;
  let beginPathMock: Mock;
  let moveToMock: Mock;
  let lineToMock: Mock;
  let fillRectMock: Mock;

  beforeEach(() => {
    strokeMock = vi.fn();
    beginPathMock = vi.fn();
    moveToMock = vi.fn();
    lineToMock = vi.fn();
    fillRectMock = vi.fn();

    const mockContext = {
      strokeStyle: '',
      lineWidth: 0,
      beginPath: beginPathMock,
      moveTo: moveToMock,
      lineTo: lineToMock,
      stroke: strokeMock,
      fillRect: fillRectMock,
      setLineDash: vi.fn(),
      canvas: {
        width: 2000,
        height: 1200,
      },
    };

    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn((contextId) => {
      if (contextId === '2d') {
        return mockContext as unknown as CanvasRenderingContext2D;
      }
      return null;
    });
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('renders grid with optimized batched stroke calls', () => {
    render(<DiagramCanvas stepKey="test-step" />);

    // Previous baseline was ~162 calls (or 324 with double render).
    // Optimization should reduce this to 1 call (or 2 with double render) for the entire grid.

    expect(strokeMock).toHaveBeenCalled();
    const callCount = strokeMock.mock.calls.length;
    console.log(`Stroke called ${callCount} times`);

    // Should be significantly less than 10.
    // Ideally 1 or 2.
    expect(callCount).toBeLessThan(10);
  });
});
