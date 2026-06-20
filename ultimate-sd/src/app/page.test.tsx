import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Fix NextAuth server module resolution error in vitest
vi.mock('@/auth', () => ({
    auth: vi.fn().mockResolvedValue(null)
}));

// Mock the DashboardClient since Home is just a server component wrapper
vi.mock('@/components/landing/DashboardClient', () => ({
  DashboardClient: () => <div data-testid="dashboard-client"><h1>Master Systems</h1></div>
}));

vi.mock('@/lib/prisma', () => ({
    prisma: { user: { findUnique: vi.fn().mockResolvedValue(null) } }
}));
vi.mock('@/app/actions/recommendations', () => ({
    getUserRecommendations: vi.fn().mockResolvedValue({ dailyPick: null, needsReview: [], recommended: [] })
}));

import Home from './page';

describe('Home', () => {
  it('renders the home page wrapper', async () => {
    // Next.js async Server Components are hard to test directly with Testing Library
    // React 19 testing library sometimes needs awaiting the component itself
    const ResolvedHome = await Home() as React.ReactElement;
    render(ResolvedHome);

    // Use accessible name which combines text across child elements
    expect(screen.getByRole('heading', { level: 1, name: /Master Systems/i })).toBeDefined();
    expect(screen.getByTestId('dashboard-client')).toBeDefined();
  });
});
