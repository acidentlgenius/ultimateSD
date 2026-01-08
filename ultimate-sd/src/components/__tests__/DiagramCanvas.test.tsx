import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiagramCanvas from '../DiagramCanvas';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock Canvas context
const mockContext = {
  fillStyle: '',
  fillRect: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  setLineDash: vi.fn(),
  strokeRect: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  font: '',
  textAlign: '',
  textBaseline: '',
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  drawImage: vi.fn(),
  createPattern: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any;
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: any) => node,
  };
});

describe('DiagramCanvas', () => {
  const stepKey = 'test-step';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<DiagramCanvas stepKey={stepKey} />);
    expect(screen.getByText('System Design Diagram')).toBeInTheDocument();
  });

  it('initializes canvas context', () => {
    render(<DiagramCanvas stepKey={stepKey} />);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
  });
});
