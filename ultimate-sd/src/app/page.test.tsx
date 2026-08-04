// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import { auth } from '@/auth';
import { getUserProgressMap } from '@/app/actions/progress';
import { prisma } from '@/lib/prisma';

const dashboardProps = vi.fn();

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/components/landing/DashboardClient', () => ({
  DashboardClient: (props: unknown) => {
    dashboardProps(props);
    return <div data-testid="dashboard-client"><h1>Master Systems</h1></div>;
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/session-user', () => ({
  resolveSessionUserId: vi.fn(async (user: { id?: string | null }) => user.id ?? null),
  SESSION_STALE_MESSAGE: 'Your session is out of date. Sign out and sign back in.',
}));

vi.mock('@/app/actions/recommendations', () => ({
  getUserRecommendations: vi.fn(() => Promise.resolve({ dailyPick: null, needsReview: [], recommended: [] })),
}));

vi.mock('@/app/actions/progress', () => ({
  getUserProgressMap: vi.fn(() => Promise.resolve(new Map())),
}));

vi.mock('@/lib/feature-flags-server', () => ({
  canAccessFeature: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/app/actions/launch-offer', () => ({
  getLaunchOfferStats: vi.fn(() =>
    Promise.resolve({
      platformClaimed: 0,
      platformRemaining: 50,
      aiWinners: 0,
      aiEligible: 0,
      isActive: true,
    })
  ),
  getLaunchOfferUserState: vi.fn(() => Promise.resolve(null)),
}));

import { resolveSessionUserId } from '@/lib/session-user';

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the home page', async () => {
    const Component = await Home();
    const html = renderToStaticMarkup(Component);
    expect(html).toContain('Master Systems');
    expect(html).toContain('dashboard-client');
  });

  it('does not load the problem catalog on the home page when logged in', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
    vi.mocked(resolveSessionUserId).mockResolvedValue('user-1');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      onboardingCompleted: true,
    } as never);

    const Component = await Home();
    renderToStaticMarkup(Component);

    expect(getUserProgressMap).not.toHaveBeenCalled();
    expect(dashboardProps).toHaveBeenCalledWith(
      expect.not.objectContaining({
        problems: expect.anything(),
      })
    );
  });

  it('reads onboardingCompleted via resolved user id when session id is stale', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'stale-id', email: 'a@b.com' },
    } as never);
    vi.mocked(resolveSessionUserId).mockResolvedValue('real-user-id');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      onboardingCompleted: true,
    } as never);

    const Component = await Home();
    renderToStaticMarkup(Component);

    expect(resolveSessionUserId).toHaveBeenCalledWith({
      id: 'stale-id',
      email: 'a@b.com',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'real-user-id' },
      select: { onboardingCompleted: true },
    });
    expect(dashboardProps).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingCompleted: true })
    );
  });

  it('passes feature flag decisions to DashboardClient', async () => {
    const Component = await Home();
    renderToStaticMarkup(Component);
    expect(dashboardProps).toHaveBeenCalledWith(
      expect.objectContaining({ fresherTrackEnabled: true, interviewModeEnabled: true })
    );
  });
});
