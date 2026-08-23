import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiInterviewerSection } from '../AiInterviewerSection';

vi.mock('@/app/actions/waitlist', () => ({
  joinWaitlist: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

describe('AiInterviewerSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<AiInterviewerSection />);
    expect(screen.getAllByRole('heading')).toBeDefined();
  });
});
