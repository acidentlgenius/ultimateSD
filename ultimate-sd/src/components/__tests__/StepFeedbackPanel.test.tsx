import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StepFeedbackPanel from '../StepFeedbackPanel';
import { updateStreak } from '@/app/actions/gamification';

vi.mock('@/app/actions/gamification', () => ({
  updateStreak: vi.fn(),
}));

vi.mock('@/components/LockedFeatureButton', () => ({
  LockedFeatureButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

const baseFeedback = {
  score: 1,
  accuracy: 10,
  strengths: ['Named shorten'],
  weaknesses: ['Too thin'],
  missed: ['Redirect'],
  isAcceptable: false,
};

describe('StepFeedbackPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateStreak).mockResolvedValue({ success: true, streak: 1 } as never);
  });

  it('shows a compact needs-work status with actionable notes', () => {
    render(
      <StepFeedbackPanel
        feedback={baseFeedback}
        probeEntitled={false}
        onStartProbe={() => {}}
      />,
    );

    expect(screen.getByText('Needs work')).toBeTruthy();
    expect(screen.getByText('Named shorten')).toBeTruthy();
    expect(screen.getByText('Redirect')).toBeTruthy();
    expect(screen.queryByText('Great Job!')).toBeNull();
    expect(screen.queryByText('Performance Score')).toBeNull();
  });

  it('shows Passed status on a passing score without a trophy hero', () => {
    render(
      <StepFeedbackPanel
        feedback={{ ...baseFeedback, score: 8, accuracy: 80, isAcceptable: true }}
        probeEntitled={false}
        xpEarned={20}
        onStartProbe={() => {}}
      />,
    );

    expect(screen.getByText('Passed')).toBeTruthy();
    expect(screen.getByText('+20 XP')).toBeTruthy();
    expect(screen.queryByText('Great Job!')).toBeNull();
  });

  it('does not render a Your submission block (left pane owns that)', () => {
    render(
      <StepFeedbackPanel
        feedback={baseFeedback}
        probeEntitled={false}
        onStartProbe={() => {}}
      />,
    );

    expect(screen.queryByText('Your submission')).toBeNull();
  });

  it('handles returned error object from updateStreak action correctly', async () => {
    const errorObj = { error: 'Failed to update streak' };

    // updateStreak returns an error object, does not throw
    vi.mocked(updateStreak).mockResolvedValue(errorObj as any);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(
      <StepFeedbackPanel
        feedback={{ ...baseFeedback, isAcceptable: true }}
        probeEntitled={false}
        onStartProbe={() => {}}
      />
    );

    // Give it a moment to run the microtask
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(updateStreak).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error updating streak:', 'Failed to update streak');

    consoleSpy.mockRestore();
    unmount();
  });

  it('handles thrown error from updateStreak action correctly', async () => {
    const error = new Error('Network error');

    // updateStreak throws a network error
    vi.mocked(updateStreak).mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(
      <StepFeedbackPanel
        feedback={{ ...baseFeedback, isAcceptable: true }}
        probeEntitled={false}
        onStartProbe={() => {}}
      />
    );

    // Give it a moment to run the microtask
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(updateStreak).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error updating streak:', error);

    consoleSpy.mockRestore();
    unmount();
  });
});
