
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DiagramCanvas from '../DiagramCanvas';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock react-dom createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...actual as any,
    createPortal: (node: React.ReactNode) => node, // Just render children directly
  };
});

// Mock canvas getContext
const mockStroke = vi.fn();
const mockBeginPath = vi.fn();
const mockMoveTo = vi.fn();
const mockLineTo = vi.fn();
const mockFillRect = vi.fn();

const mockGetContext = vi.fn(() => ({
  strokeStyle: '',
  lineWidth: 0,
  beginPath: mockBeginPath,
  moveTo: mockMoveTo,
  lineTo: mockLineTo,
  stroke: mockStroke,
  fillRect: mockFillRect,
  setLineDash: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  strokeRect: vi.fn(),
  font: '',
  fillStyle: '',
  textAlign: '',
  textBaseline: '',
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
}));

describe('DiagramCanvas Performance', () => {
  beforeEach(() => {
    // Setup portal container
    const portalDiv = document.createElement('div');
    portalDiv.id = 'design-name-portal';
    document.body.appendChild(portalDiv);

    // Mock canvas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = mockGetContext as any;

    // Clear mocks
    mockStroke.mockClear();
    mockBeginPath.mockClear();
    mockMoveTo.mockClear();
    mockLineTo.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('draws grid efficiently with batched stroke calls', () => {
    render(<DiagramCanvas stepKey="test-optimized" />);

    // DiagramCanvas draws the grid initially.
    // Width 2000, Height 1200. GridSize 20.
    // Previously: ~160 stroke calls.
    // Now: Should be 1 stroke call per render.

    // Check call count.
    // It renders twice (StrictMode or effect), so we expect ~2 calls.

    const strokeCalls = mockStroke.mock.calls.length;
    console.log(`Optimized Stroke Calls: ${strokeCalls}`);

    // We expect a very low number of calls now.
    expect(strokeCalls).toBeLessThan(10);
    expect(strokeCalls).toBeGreaterThan(0); // It should still draw something
  });
});
