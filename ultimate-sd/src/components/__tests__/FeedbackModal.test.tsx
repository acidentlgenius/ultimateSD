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

    expect(requestSpy).toHaveBeenCalled();

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    requestSpy.mockRestore();
    cancelSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  it('does not throw accessibility warnings regarding missing DialogDescription', () => {
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
      />
    );

    // Verify console.error was not called with the specific Radix UI warning
    const calls = consoleSpy.mock.calls;
    const hasAccessibilityWarning = calls.some(call =>
      call.join(' ').includes('Warning: Missing `Description` or `aria-describedby')
    );

    expect(hasAccessibilityWarning).toBe(false);

    consoleSpy.mockRestore();
  });

  it('shows the submitted answer that was scored', () => {
    const feedback = {
      score: 1,
      accuracy: 10,
      strengths: [],
      weaknesses: ['Too thin'],
      isAcceptable: false,
    };

    render(
      <FeedbackModal
        isOpen={true}
        feedback={feedback}
        onClose={() => {}}
        probeEntitled={false}
        onStartProbe={() => {}}
        userAnswer={'shorten urls'}
      />
    );

    expect(screen.getByText('Your submission')).toBeTruthy();
    expect(screen.getByText('shorten urls')).toBeTruthy();
  });
});
