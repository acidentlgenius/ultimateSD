import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProbePanel from '../ProbePanel';
import { fetchWithRetry } from '@/lib/fetchUtils';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/fetchUtils', () => ({
  fetchWithRetry: vi.fn(),
  getUserFacingFetchError: vi.fn((e) => e.message),
}));

describe('ProbePanel', () => {
  const mockProblem = { slug: 'test-slug', title: 'Test Problem' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles error properly when fetchWithRetry throws', async () => {
    (fetchWithRetry as any).mockRejectedValue(new Error('Network error'));

    render(<ProbePanel problem={mockProblem} phase="hld" stepAnswer="test answer" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders AI response when successful', async () => {
    (fetchWithRetry as any).mockResolvedValue({
      ok: true,
      json: async () => ({ message: { id: '1', role: 'ai', content: 'Good design' }, round: 1, isFinal: false })
    });

    render(<ProbePanel problem={mockProblem} phase="hld" stepAnswer="test answer" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Good design')).toBeInTheDocument();
    });
  });
});
