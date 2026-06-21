import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/components/landing/DashboardClient', () => ({
  DashboardClient: () => <div data-testid="dashboard-client"><h1>Master Systems</h1></div>,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/app/actions/recommendations', () => ({
  getUserRecommendations: vi.fn(() => Promise.resolve({ dailyPick: null, needsReview: [], recommended: [] })),
}));

describe('Home', () => {
  it('renders the home page', async () => {
    const Component = await Home();
    render(Component);
    expect(screen.getByRole('heading', { level: 1, name: /Master Systems/i })).toBeDefined();
    expect(screen.getByTestId('dashboard-client')).toBeDefined();
  });
});
