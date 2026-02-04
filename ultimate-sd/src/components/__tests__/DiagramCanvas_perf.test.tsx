import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DiagramCanvas from '../DiagramCanvas';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('DiagramCanvas Performance', () => {
  let strokeSpy: any;
  let beginPathSpy: any;
  let moveToSpy: any;
  let lineToSpy: any;
  let portalContainer: HTMLElement;

  beforeEach(() => {
    // Setup portal container
    portalContainer = document.createElement('div');
    portalContainer.id = 'design-name-portal';
    document.body.appendChild(portalContainer);

    strokeSpy = vi.fn();
    beginPathSpy = vi.fn();
    moveToSpy = vi.fn();
    lineToSpy = vi.fn();

    // Mock Canvas Context
    const mockContext = {
      strokeStyle: '',
      lineWidth: 0,
      beginPath: beginPathSpy,
      moveTo: moveToSpy,
      lineTo: lineToSpy,
      stroke: strokeSpy,
      fillRect: vi.fn(),
      setLineDash: vi.fn(),
      // Add other necessary methods to prevent crashes
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
      ellipse: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      strokeRect: vi.fn(),
      quadraticCurveTo: vi.fn(),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockContext as any);
  });

  afterEach(() => {
    document.body.removeChild(portalContainer);
    vi.restoreAllMocks();
  });

  it('draws grid efficiently', () => {
    render(<DiagramCanvas stepKey="perf-test" />);

    // Grid size 20. Width 2000, Height 1200.
    // 2000/20 = 100 lines + 1 (start) = 101 vertical lines.
    // 1200/20 = 60 lines + 1 (start) = 61 horizontal lines.
    // Total 162 strokes for grid if unoptimized.

    console.log('Total stroke calls:', strokeSpy.mock.calls.length);

    // Optimized assertion: Grid should be drawn with batched calls.
    // It should be significantly less than the unoptimized 160+ calls.
    // With optimization, we expect exactly 2 calls (due to strict mode or double render effects seen in baseline 324 -> 2 calls)
    expect(strokeSpy.mock.calls.length).toBeLessThan(10);

    // Verify that drawing commands are still being issued (batched, not deleted)
    // We expect 160+ moveTos/lineTos for the grid
    expect(moveToSpy.mock.calls.length).toBeGreaterThan(100);
    expect(lineToSpy.mock.calls.length).toBeGreaterThan(100);
  });
});
