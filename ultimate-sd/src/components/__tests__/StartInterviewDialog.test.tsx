import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StartInterviewDialog } from '@/components/StartInterviewDialog';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('StartInterviewDialog', () => {
  it('shows voice variant disabled with pricing link when voice not entitled', () => {
    render(
      <StartInterviewDialog slug="design-tinyurl" interviewEntitled voiceEntitled={false} />
    );
    fireEvent.click(screen.getByRole('button', { name: /start interview/i }));
    const voiceLink = screen.getByRole('link', { name: /see plans for voice/i });
    expect(voiceLink.getAttribute('href')).toBe('/pricing?feature=voiceInterview');
  });
});
