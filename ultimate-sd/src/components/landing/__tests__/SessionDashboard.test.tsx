import { render, screen, act } from '@testing-library/react';
import { SessionDashboard } from '../SessionDashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as sessionStorageLib from '@/lib/session-storage';
import '@testing-library/jest-dom';

vi.mock('@/lib/session-storage', () => ({
  getAllSessions: vi.fn(),
  clearSessionState: vi.fn(),
}));

describe('SessionDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders a placeholder when there are no sessions', async () => {
    vi.mocked(sessionStorageLib.getAllSessions).mockReturnValue([]);

    await act(async () => {
      render(<SessionDashboard />);
    });

    expect(screen.getByText('No saved offline sessions yet')).toBeInTheDocument();
  });

  it('renders sessions when available', async () => {
    vi.mocked(sessionStorageLib.getAllSessions).mockReturnValue([
      { problemSlug: 'design-tinyurl', lastUpdated: new Date(), stepCount: 3 }
    ]);

    await act(async () => {
      render(<SessionDashboard />);
    });

    expect(screen.getByText('design tinyurl')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
