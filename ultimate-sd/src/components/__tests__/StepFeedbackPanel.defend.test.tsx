import { render, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StepFeedbackPanel from '../StepFeedbackPanel';
import { updateStreak } from '@/app/actions/gamification';

vi.mock('@/app/actions/gamification', () => ({
  updateStreak: vi.fn(),
}));

describe('StepFeedbackPanel UpdateStreak Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles server action errors from updateStreak', async () => {
    vi.mocked(updateStreak).mockResolvedValue({ error: 'Server error occurred' } as any);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <StepFeedbackPanel
        feedback={{ score: 10, accuracy: 100, strengths: [], weaknesses: [], isAcceptable: true }}
        probeEntitled={false}
        onStartProbe={() => {}}
      />
    );

    await waitFor(() => {
      expect(updateStreak).toHaveBeenCalled();
    });

    // Allow promises to resolve
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    // Check if console.error was called with the specific message, ignoring act warnings
    await waitFor(() => {
      const calls = consoleSpy.mock.calls;
      const found = calls.some(call => call[0] === 'Failed to update streak:' && call[1] === 'Server error occurred');
      expect(found).toBe(true);
    });

    consoleSpy.mockRestore();
  });

  it('handles network errors from updateStreak', async () => {
    const error = new Error('Network error');
    vi.mocked(updateStreak).mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <StepFeedbackPanel
        feedback={{ score: 10, accuracy: 100, strengths: [], weaknesses: [], isAcceptable: true }}
        probeEntitled={false}
        onStartProbe={() => {}}
      />
    );

    await waitFor(() => {
      expect(updateStreak).toHaveBeenCalled();
    });

    // Allow promises to reject
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    // Check if console.error was called with the specific message, ignoring act warnings
    await waitFor(() => {
      const calls = consoleSpy.mock.calls;
      const found = calls.some(call => call[0] === 'Error updating streak:' && call[1] === error);
      expect(found).toBe(true);
    });

    consoleSpy.mockRestore();
  });
});
