import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
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
    // Since Home is an async server component, we need to await its result before rendering
    const Component = await Home();
    render(Component);
    // Use accessible name which combines text across child elements
    expect(screen.getByRole('heading', { level: 1, name: /Master Systems/i })).toBeDefined();
  });
});
