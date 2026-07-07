import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedbackModal from '../FeedbackModal';
import { updateStreak } from '@/app/actions/gamification';

vi.mock('@/app/actions/gamification', () => ({
  updateStreak: vi.fn()
}));

describe('FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles server action errors from updateStreak', async () => {
    // Mock updateStreak to return an error object
    vi.mocked(updateStreak).mockResolvedValue({ error: 'Server error occurred' } as any);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const feedback = {
      score: 10,
      accuracy: 100,
      strengths: [],
      weaknesses: [],
      isAcceptable: true
    };

    render(
      <FeedbackModal
        isOpen={true}
        feedback={feedback}
        onClose={() => {}}
        probeEntitled={false}
        onStartProbe={() => {}}
        xpEarned={10}
      />
    );

    // Give the promise time to resolve
    await new Promise(r => setTimeout(r, 100));

    expect(updateStreak).toHaveBeenCalled();
    // In our fixed version, it should log the server action error
    expect(consoleSpy).toHaveBeenCalledWith('Failed to update streak:', 'Server error occurred');

    consoleSpy.mockRestore();
  });

  it('handles network errors from updateStreak', async () => {
    // Mock updateStreak to throw a network error
    const error = new Error('Network error');
    vi.mocked(updateStreak).mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const feedback = {
      score: 10,
      accuracy: 100,
      strengths: [],
      weaknesses: [],
      isAcceptable: true
    };

    render(
      <FeedbackModal
        isOpen={true}
        feedback={feedback}
        onClose={() => {}}
        probeEntitled={false}
        onStartProbe={() => {}}
        xpEarned={10}
      />
    );

    // Give the promise time to reject
    await new Promise(r => setTimeout(r, 100));

    expect(updateStreak).toHaveBeenCalled();
    // In our fixed version, it should catch the error
    expect(consoleSpy).toHaveBeenCalledWith('Error updating streak:', error);

    consoleSpy.mockRestore();
  });
  it('clears animation frames on unmount', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(updateStreak).mockResolvedValue({ success: true, streak: 1 } as any);
    vi.useFakeTimers();

    // Spy on the global animation frame functions
    const requestSpy = vi.spyOn(global, 'requestAnimationFrame');
    const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const feedback = {
      score: 10,
      accuracy: 100,
      strengths: [],
      weaknesses: [],
      isAcceptable: true
    };

    const { unmount } = render(
      <FeedbackModal
        isOpen={true}
        feedback={feedback}
        onClose={() => {}}
        probeEntitled={false}
        onStartProbe={() => {}}
        xpEarned={10}
      />
    );

    // Initial render should have called requestAnimationFrame for score
    expect(requestSpy).toHaveBeenCalled();

    // Unmount the component to trigger cleanup
    unmount();

    // Cleanup should call cancelAnimationFrame and clearTimeout
    expect(cancelSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    requestSpy.mockRestore();
    cancelSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  it('renders DialogContent without accessibility warnings by setting aria-describedby', () => {
    // SQUASH: Regression test for the accessibility warning when DialogDescription is missing
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const feedback = {
      score: 10,
      accuracy: 100,
      strengths: [],
      weaknesses: [],
      isAcceptable: true
    };

    render(
      <FeedbackModal
        isOpen={true}
        feedback={feedback}
        onClose={() => {}}
        probeEntitled={false}
        onStartProbe={() => {}}
        xpEarned={10}
      />
    );

    // Verify the specific warning is NOT in the console output
    const warningCalls = consoleSpy.mock.calls.filter(call =>
      call[0] && typeof call[0] === 'string' && call[0].includes('Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}')
    );
    expect(warningCalls.length).toBe(0);

    consoleSpy.mockRestore();
  });
});
