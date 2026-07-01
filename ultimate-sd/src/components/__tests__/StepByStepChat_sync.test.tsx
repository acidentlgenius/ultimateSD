import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE importing the component to avoid Next.js server import issues in Vitest
vi.mock('next-auth/react', () => ({
  useSession: vi.fn().mockReturnValue({
    data: { user: { id: 'test-user', hasActivePlan: true } },
    status: 'authenticated'
  })
}));

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: null })
}));

vi.mock('@/app/actions/progress', () => ({
  updateProblemProgress: vi.fn(),
  completeStep: vi.fn(),
  syncSessionState: vi.fn(),
  getSavedSessionState: vi.fn().mockResolvedValue({ success: true, sessionState: null })
}));

vi.mock('next/dynamic', () => ({
  default: vi.fn().mockReturnValue(() => null)
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => ''
}));

import StepByStepChat from '../StepByStepChat';
import { syncSessionState } from '@/app/actions/progress';

describe('StepByStepChat syncSessionState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  const mockProblem = {
    id: 'prob-1',
    slug: 'design-test',
    title: 'Design Test',
    description: 'Test description',
    difficulty: 'MEDIUM',
    category: 'System Design',
    steps: null, // use default steps
  };

  it('handles server action errors from syncSessionState', async () => {
    // Mock syncSessionState to return an error object (simulating Server Action behavior)
    vi.mocked(syncSessionState).mockResolvedValue({ success: false, error: 'Server error occurred' } as any);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(
        <StepByStepChat problem={mockProblem as any} />
      );
    });

    // Give it time to mount and run the async load effect
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // The sync effect runs with a 2-second debounce after mount or state change
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(syncSessionState).toHaveBeenCalled();
    // Verify that the error returned by the server action is logged
    expect(consoleSpy).toHaveBeenCalledWith('Failed to sync session state to cloud:', 'Server error occurred');

    consoleSpy.mockRestore();
  });

  it('handles network errors from syncSessionState', async () => {
    // Mock syncSessionState to throw a network error
    const error = new Error('Network error');
    vi.mocked(syncSessionState).mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(
        <StepByStepChat problem={mockProblem as any} />
      );
    });

    // Give it time to mount and run the async load effect
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // The sync effect runs with a 2-second debounce
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(syncSessionState).toHaveBeenCalled();
    // Verify that thrown network errors are logged
    expect(consoleSpy).toHaveBeenCalledWith('Error syncing session state to cloud:', error);

    consoleSpy.mockRestore();
  });
});
