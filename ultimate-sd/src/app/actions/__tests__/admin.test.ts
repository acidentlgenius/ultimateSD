import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockSendPlanWelcomeEmail = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('@/auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }));
vi.mock('@/lib/email', () => ({
  EmailConfigurationError: class EmailConfigurationError extends Error {
    name = 'EmailConfigurationError';
  },
  sendPlanWelcomeEmail: (...args: unknown[]) => mockSendPlanWelcomeEmail(...args),
}));

import { updateUserPlan } from '../admin';

describe('updateUserPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFindUnique.mockReset();
    mockFindUnique.mockImplementation((args: { select?: { role?: boolean; email?: boolean } }) => {
      if (args?.select?.role) {
        return Promise.resolve({ role: 'ADMIN' });
      }
      return Promise.resolve({ email: 'user@example.com', name: 'Alex' });
    });
    mockUpdate.mockResolvedValue({});
    mockSendPlanWelcomeEmail.mockResolvedValue(undefined);
  });

  it('sends welcome email when granting a paid plan', async () => {
    const result = await updateUserPlan('user-1', 'platform');

    expect(result).toEqual({ success: true, emailSent: true });
    expect(mockSendPlanWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        name: 'Alex',
        planType: 'platform',
      })
    );
  });

  it('does not send welcome email when setting free plan', async () => {
    const result = await updateUserPlan('user-1', 'free');

    expect(result).toEqual({ success: true, emailSent: false });
    expect(mockSendPlanWelcomeEmail).not.toHaveBeenCalled();
  });

  it('returns success with emailSent false when email is not configured', async () => {
    const { EmailConfigurationError } = await import('@/lib/email');
    mockSendPlanWelcomeEmail.mockRejectedValue(new EmailConfigurationError());

    const result = await updateUserPlan('user-1', 'ai');

    expect(result).toEqual({ success: true, emailSent: false });
  });
});
