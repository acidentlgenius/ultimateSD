import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiagramCanvas from '../DiagramCanvas';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock react-dom createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('DiagramCanvas', () => {
  let mockContext: any;

  beforeEach(() => {
    // Mock HTMLCanvasElement.prototype.getContext
    mockContext = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      drawImage: vi.fn(),
      quadraticCurveTo: vi.fn(),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      textAlign: '',
      textBaseline: '',
    };

    HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
       if (contextId === '2d') return mockContext;
       return null;
    }) as any;

    // Mock getBoundingClientRect
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 2000,
      height: 1200,
      x: 0,
      y: 0,
      bottom: 1200,
      right: 2000,
      toJSON: () => {},
    }));
  });

  it('renders successfully', () => {
    render(<DiagramCanvas stepKey="test-step" />);
    // Since DiagramCanvas uses a canvas element, we can look for it
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('initializes grid drawing', () => {
    render(<DiagramCanvas stepKey="test-step" />);
    // Grid should be drawn on mount
    expect(mockContext.stroke).toHaveBeenCalled();
  });
});
