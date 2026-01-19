import { render, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DiagramCanvas from '../DiagramCanvas';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: ResizeObserverCallback) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _cb = callback;
  }
};

describe('DiagramCanvas Performance', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ctxMock: any;
  let elementStrokeCount = 0;

  beforeEach(() => {
    elementStrokeCount = 0;

    ctxMock = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      setLineDash: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn().mockImplementation(() => {
        // Only count element strokes (lineWidth >= 2)
        // Grid lines have lineWidth 0.5
        if (ctxMock.lineWidth >= 2) {
          elementStrokeCount++;
        }
      }),
      fill: vi.fn(),
      ellipse: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
      if (contextId === '2d') {
        return ctxMock;
      }
      return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures draw calls for server element', async () => {
    render(<DiagramCanvas stepKey="test" />);

    const serverElement = {
      id: '1',
      type: 'server',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      color: '#000000',
    };

    await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([serverElement]);
        }
    });

    elementStrokeCount = 0;

    await act(async () => {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([serverElement]);
        }
    });

    // Expectation: 3 strokes for lines -> Optimized to 1
    expect(elementStrokeCount).toBe(1);
  });

  it('measures draw calls for loadbalancer element', async () => {
    render(<DiagramCanvas stepKey="test" />);

    const lbElement = {
      id: '2',
      type: 'loadbalancer',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      color: '#000000',
    };

    await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([lbElement]);
        }
    });

    elementStrokeCount = 0;

    await act(async () => {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([lbElement]);
        }
    });

    // Expectation:
    // 1 stroke for semi-circle
    // 1 stroke for ticks (batched)
    // 1 stroke for needle
    // Total: 7 -> Optimized to 3
    expect(elementStrokeCount).toBe(3);
  });

  it('measures draw calls for api element', async () => {
    render(<DiagramCanvas stepKey="test" />);

    const apiElement = {
      id: '3',
      type: 'api',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      color: '#000000',
    };

    await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([apiElement]);
        }
    });

    elementStrokeCount = 0;

    await act(async () => {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([apiElement]);
        }
    });

    // Expectation:
    // 1 stroke for connector top
    // 1 stroke for pins (batched)
    // 1 stroke for cable line
    // Total: 5 -> Optimized to 3
    expect(elementStrokeCount).toBe(3);
  });

  it('measures draw calls for database element', async () => {
    render(<DiagramCanvas stepKey="test" />);

    const dbElement = {
      id: '4',
      type: 'database',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      color: '#000000',
    };

    await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([dbElement]);
        }
    });

    elementStrokeCount = 0;

    await act(async () => {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       if ((window as any).sd_loadDiagramElements) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).sd_loadDiagramElements([dbElement]);
        }
    });

    // Expectation:
    // 1 stroke for top ellipse
    // 1 stroke for vertical lines (batched)
    // 1 stroke for bottom ellipse
    // Total: 4 -> Optimized to 3
    expect(elementStrokeCount).toBe(3);
  });
});
