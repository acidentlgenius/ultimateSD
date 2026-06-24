import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn()
}));

vi.mock('@/app/actions/progress', () => ({
  syncSessionState: vi.fn(),
  getSavedSessionState: vi.fn().mockResolvedValue({ success: true, sessionState: null }),
  updateProblemProgress: vi.fn(),
  completeStep: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => ''
}));

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="dynamic-widget" />
}));

import { render, waitFor, screen, act } from '@testing-library/react';
import React from 'react';
import StepByStepChat from '../StepByStepChat';
import { syncSessionState, getSavedSessionState } from '@/app/actions/progress';
import { useSession } from 'next-auth/react';

const mockProblem = {
  id: 'prob1',
  title: 'Test Problem',
  slug: 'test-problem',
  difficulty: 'Medium',
  description: 'Test description',
  timeLimit: 30
};

describe('StepByStepChat - syncSessionState Floating Promise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles syncSessionState errors properly without floating promises', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user1', hasActivePlan: true } },
      status: 'authenticated',
      update: vi.fn()
    } as any);

    vi.mocked(getSavedSessionState).mockResolvedValue({ success: true, sessionState: null } as any);

    // Mock it to throw an error instead of returning an error object!
    // Actually, `syncSessionState` returns `{ success: false, error: '...' }` when catching inside the action,
    // but if we are testing `.catch()` on the client side, that means the Promise itself rejected (e.g., network error).
    // Let's test a Promise rejection to see if .catch handles it properly.
    const networkError = new Error('Network error');
    vi.mocked(syncSessionState).mockRejectedValue(networkError as any);

    const logSpy = vi.fn();
    vi.spyOn(console, 'error').mockImplementation((...args) => {
        if (args[0] === 'Failed to sync session state to cloud:') {
            logSpy(...args);
        }
    });

    render(<StepByStepChat problem={mockProblem as any} initialSessionState={null} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
      const nextButton = screen.getByText('Skip');
      nextButton.click();
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(syncSessionState).toHaveBeenCalled();
    // It should log the network error
    expect(logSpy).toHaveBeenCalledWith('Failed to sync session state to cloud:', networkError);
  });

  it('handles server action error objects properly without floating promises', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user1', hasActivePlan: true } },
      status: 'authenticated',
      update: vi.fn()
    } as any);

    vi.mocked(getSavedSessionState).mockResolvedValue({ success: true, sessionState: null } as any);

    // Mock it to return an error object
    vi.mocked(syncSessionState).mockResolvedValue({ success: false, error: 'Database timeout' } as any);

    const logSpy = vi.fn();
    vi.spyOn(console, 'error').mockImplementation((...args) => {
        if (args[0] === 'Failed to sync session state to cloud:') {
            logSpy(...args);
        }
    });

    render(<StepByStepChat problem={mockProblem as any} initialSessionState={null} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
      const nextButton = screen.getByText('Skip');
      nextButton.click();
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(syncSessionState).toHaveBeenCalled();
    // In the fixed version, this should log the error from the object.
    expect(logSpy).toHaveBeenCalledWith('Failed to sync session state to cloud:', 'Database timeout');
  });
});
