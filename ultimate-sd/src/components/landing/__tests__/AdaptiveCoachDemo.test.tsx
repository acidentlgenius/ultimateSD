import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveCoachDemo } from '../AdaptiveCoachDemo';
import { getDemoScript } from '@/lib/adaptive-coach/demo/landing-demo';
import '@testing-library/jest-dom';

vi.mock('@/lib/adaptive-coach/demo/landing-demo', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    getDemoScript: vi.fn(),
  };
});

describe('AdaptiveCoachDemo', () => {
  const mockScript = [
    { id: '1', role: 'coach', body: 'Test Beat 1', atMs: 100 },
    { id: '2', role: 'you', body: 'Test Beat 2', atMs: 500 },
  ];

  beforeEach(() => {
    vi.mocked(getDemoScript).mockReturnValue(mockScript as any);

    // Mock window.matchMedia
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
  });

  it('renders the header correctly', () => {
    render(<AdaptiveCoachDemo />);
    expect(screen.getByText(/Same rough answer/i)).toBeInTheDocument();
  });

  it('renders level tabs', () => {
    render(<AdaptiveCoachDemo />);
    expect(screen.getByRole('tab', { name: /Fresher/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /SDE-1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Senior/i })).toBeInTheDocument();
  });
});
