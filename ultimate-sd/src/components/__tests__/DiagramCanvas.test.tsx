import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DiagramCanvas from '../DiagramCanvas';

// Mock Canvas API
const mockContext = {
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  fillText: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  setLineDash: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext as any);

// Mock getBoundingClientRect
HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
  width: 100,
  height: 100,
  x: 0,
  y: 0,
  toJSON: () => {}
}));

// Mock resize observer
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('DiagramCanvas', () => {
  it('renders without crashing', () => {
    render(<DiagramCanvas stepKey="test-step" />);
    // Since it's a client component with useEffect for mounting,
    // we might just check if it doesn't throw.
    // The component renders a loading state initially.
  });
});
