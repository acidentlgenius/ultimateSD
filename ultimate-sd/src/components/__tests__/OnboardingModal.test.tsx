import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingModal from '../OnboardingModal';
import { skipOnboarding } from '@/app/actions/progress';
import { toast } from 'sonner';

vi.mock('@/app/actions/progress', () => ({
  skipOnboarding: vi.fn(),
  saveUserPreferences: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('OnboardingModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the modal open and toasts when skip fails to persist', async () => {
    vi.mocked(skipOnboarding).mockResolvedValue({
      success: false,
      error: 'session_stale',
      message: 'Your session is out of date. Sign out and sign back in.',
    });

    render(
      <OnboardingModal isOpen={true} onClose={onClose} userId="user-1" />
    );

    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));

    await waitFor(() => {
      expect(skipOnboarding).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('closes after skip persists successfully', async () => {
    vi.mocked(skipOnboarding).mockResolvedValue({ success: true });

    render(
      <OnboardingModal isOpen={true} onClose={onClose} userId="user-1" />
    );

    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
