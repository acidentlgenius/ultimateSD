import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedbackModal from '@/components/FeedbackModal';

vi.mock('@/app/actions/gamification', () => ({ updateStreak: vi.fn() }));

const feedback = {
  score: 8,
  accuracy: 80,
  strengths: [],
  weaknesses: [],
  missedPoints: [],
  isAcceptable: true,
};

describe('Defend your design button', () => {
  it('always renders when answer is acceptable, even when not entitled', () => {
    render(
      <FeedbackModal
        isOpen
        feedback={feedback}
        onClose={() => {}}
        onContinue={() => {}}
        probeEntitled={false}
        onStartProbe={() => {}}
      />
    );
    const btn = screen.getByRole('button', { name: /defend your design/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is enabled when entitled', () => {
    render(
      <FeedbackModal
        isOpen
        feedback={feedback}
        onClose={() => {}}
        onContinue={() => {}}
        probeEntitled
        onStartProbe={() => {}}
      />
    );
    expect((screen.getByRole('button', { name: /defend your design/i }) as HTMLButtonElement).disabled).toBe(
      false
    );
  });
});
