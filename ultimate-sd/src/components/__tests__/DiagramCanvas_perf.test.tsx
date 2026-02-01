import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiagramCanvas from '../DiagramCanvas';
import { vi } from 'vitest';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('DiagramCanvas Performance', () => {
  let strokeCount = 0;

  beforeEach(() => {
    strokeCount = 0;
    // Setup portal container
    const portal = document.createElement('div');
    portal.id = 'design-name-portal';
    document.body.appendChild(portal);

    // Mock Canvas API
    HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
      if (contextId === '2d') {
         return {
           canvas: { width: 2000, height: 1200 },
           beginPath: vi.fn(),
           moveTo: vi.fn(),
           lineTo: vi.fn(),
           stroke: vi.fn(() => {
             strokeCount++;
           }),
           fillRect: vi.fn(),
           strokeRect: vi.fn(),
           ellipse: vi.fn(),
           fill: vi.fn(),
           arc: vi.fn(),
           closePath: vi.fn(),
           setLineDash: vi.fn(),
           fillText: vi.fn(),
           measureText: vi.fn(() => ({ width: 10 })),
           font: '',
           fillStyle: '',
           strokeStyle: '',
           lineWidth: 0,
           textAlign: '',
           textBaseline: '',
         } as unknown as CanvasRenderingContext2D;
      }
      return null;
    }) as any;
  });

  afterEach(() => {
     document.body.innerHTML = '';
     vi.restoreAllMocks();
  });

  it('calls stroke() minimally for grid in optimized implementation', () => {
    render(<DiagramCanvas stepKey="test-step" />);

    // The grid is optimized to use a single path batch.
    // React StrictMode might cause double render, or initial render + useEffect update.
    // But it should be drastically lower than 100+.
    // Ideally it's 1 (or 2 if rendered twice).

    console.log(`Stroke calls: ${strokeCount}`);
    expect(strokeCount).toBeLessThan(10);
  });
});
