import { render } from '@testing-library/react';
import DiagramCanvas from '../DiagramCanvas';
import { vi, describe, it, expect } from 'vitest';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Mock Canvas API
const mockStroke = vi.fn();
const mockBeginPath = vi.fn();
const mockMoveTo = vi.fn();
const mockLineTo = vi.fn();

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      strokeStyle: '',
      lineWidth: 0,
      beginPath: mockBeginPath,
      moveTo: mockMoveTo,
      lineTo: mockLineTo,
      stroke: mockStroke,
      fillRect: vi.fn(),
      setLineDash: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      strokeRect: vi.fn(),
      measureText: () => ({ width: 0 }),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
});

describe('DiagramCanvas Performance', () => {
  it('should batch grid drawing operations', () => {
    render(<DiagramCanvas stepKey="test-step" />);

    // We expect stroke to be called significantly fewer times than (width/20 + height/20)
    // Default width=2000, height=1200. Grid=20.
    // X lines: 100, Y lines: 60. Total 160 strokes if unoptimized.
    // Optimized: 1 stroke (or 2 if separated by axis).

    // Note: The test will fail initially if the code is unoptimized (> 10 strokes).
    expect(mockStroke.mock.calls.length).toBeLessThan(10);
  });
});
