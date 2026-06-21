import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import DiagramCanvas from '../DiagramCanvas';

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function(key: string) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  fillRect: vi.fn(), // Added fillRect
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  setLineDash: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  fillText: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
});

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light' })
}));

describe('DiagramCanvas localStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should not crash if saved-designs-list is corrupted', async () => {
    // Set corrupted data
    localStorageMock.setItem('saved-designs-list', '{ invalid JSON');

    // We expect it NOT to throw an error and render
    const { container } = render(<DiagramCanvas />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});
