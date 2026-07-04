import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InterviewHubClient } from '@/app/interview/InterviewHubClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockProblem = {
  slug: 'design-tinyurl',
  title: 'Design TinyURL',
  id: '1',
  difficulty: 'Easy' as const,
  description: '',
  category: 'Storage',
  companies: [],
  requirements: [],
};

describe('InterviewHubClient', () => {
  it('always renders the hub title even when locked', () => {
    render(
      <InterviewHubClient
        interviewEntitled={false}
        voiceEntitled={false}
        problems={[mockProblem]}
        debriefs={[]}
      />
    );
    expect(screen.getByRole('heading', { name: /interview hub/i })).toBeTruthy();
    expect(screen.getByText(/how it works/i)).toBeTruthy();
    const seePlans = screen.getAllByRole('link', { name: /see plans/i });
    expect(seePlans.some((el) => el.getAttribute('href') === '/pricing?feature=interviewMode')).toBe(
      true
    );
  });

  it('shows variant picker when entitled', () => {
    render(
      <InterviewHubClient
        interviewEntitled
        voiceEntitled
        problems={[mockProblem]}
        debriefs={[]}
      />
    );
    expect(screen.getByRole('button', { name: /45-min lite/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /voice/i })).toBeTruthy();
  });
});
