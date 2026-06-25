import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, vi, describe, beforeEach, afterEach } from 'vitest';
import DiagramCanvas from '../DiagramCanvas';
import React from 'react';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Next-themes mock
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() })
}));

describe('DiagramCanvas Load Design from localStorage', () => {
  let portalRoot: HTMLDivElement;

  beforeEach(() => {
    // Setup portal root required by DiagramCanvas
    portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'design-name-portal');
    document.body.appendChild(portalRoot);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  test('should not crash and should show error toast when loading corrupted design from localStorage', async () => {
    // Save corrupted design and put it in the saved-designs-list so we can click load
    localStorage.setItem('saved-design-corrupt-design', 'invalid json string');
    localStorage.setItem('saved-designs-list', JSON.stringify([{name: 'corrupt-design', date: new Date().toISOString()}]));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Render the component
    render(<DiagramCanvas stepKey="test-step" />);

    // Open load modal
    const loadButton = screen.getByTitle('Load Saved Design');
    fireEvent.click(loadButton);

    // Click load on the corrupt design
    const loadButtons = await screen.findAllByText('Load');
    fireEvent.click(loadButtons[0]);

    // Check that we logged the error and didn't crash
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading design:', expect.any(Error));
    });

    // Check that it removed the bad key from localStorage
    expect(localStorage.getItem('saved-design-corrupt-design')).toBeNull();

    // Check that it was also removed from the saved-designs-list
    const savedDesignsList = JSON.parse(localStorage.getItem('saved-designs-list') || '[]');
    expect(savedDesignsList).toHaveLength(0);

    consoleSpy.mockRestore();
  });
});
