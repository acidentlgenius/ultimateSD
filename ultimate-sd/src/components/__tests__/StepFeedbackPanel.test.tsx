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

  it('handles server action errors from updateStreak', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(updateStreak).mockResolvedValue({ error: 'Server error occurred' } as any);

    render(
      <StepFeedbackPanel
        feedback={{ ...baseFeedback, score: 8, accuracy: 80, isAcceptable: true }}
        probeEntitled={false}
        onStartProbe={() => {}}
      />
    );

    // Give the useEffect time to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(updateStreak).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Failed to update streak:', 'Server error occurred');
    errorSpy.mockRestore();
  });

  it('handles network errors from updateStreak', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Network failure');
    vi.mocked(updateStreak).mockRejectedValue(error);

    render(
      <StepFeedbackPanel
        feedback={{ ...baseFeedback, score: 8, accuracy: 80, isAcceptable: true }}
        probeEntitled={false}
        onStartProbe={() => {}}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(updateStreak).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Error updating streak:', error);
    errorSpy.mockRestore();
  });
});
