import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AiInterviewerSection } from '@/components/landing/AiInterviewerSection';

vi.mock('@/app/actions/waitlist', () => ({ joinWaitlist: vi.fn() }));

describe('AiInterviewerSection', () => {
  it('shows waitlist form when interview mode is dark', () => {
    render(<AiInterviewerSection interviewModeEnabled={false} />);
    expect(screen.getByPlaceholderText(/you@/)).toBeTruthy();
  });

  it('shows live CTA to /interview when entitled', () => {
    render(<AiInterviewerSection interviewModeEnabled />);
    expect(screen.getByRole('link', { name: /start mock interview/i }).getAttribute('href')).toBe(
      '/interview'
    );
    expect(screen.queryByPlaceholderText(/you@/)).toBeNull();
  });
});
