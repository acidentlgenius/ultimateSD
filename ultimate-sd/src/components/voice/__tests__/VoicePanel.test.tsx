import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoicePanel from '../VoicePanel';
import { fetchWithRetry } from '@/lib/fetchUtils';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/fetchUtils', () => ({
  fetchWithRetry: vi.fn(),
  getUserFacingFetchError: vi.fn((e) => e.message),
}));

describe('VoicePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders start button initially', () => {
    render(<VoicePanel slug="test-slug" problemTitle="Test Problem" />);
    expect(screen.getByTestId('voice-start')).toBeInTheDocument();
  });

  it('handles error when starting session fails', async () => {
    (fetchWithRetry as any).mockRejectedValue(new Error('Failed to start session'));

    render(<VoicePanel slug="test-slug" problemTitle="Test Problem" />);
    fireEvent.click(screen.getByTestId('voice-start'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to start session/)).toBeInTheDocument();
    });
  });
});
