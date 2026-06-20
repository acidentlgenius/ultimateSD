import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/app/actions/recommendations', () => ({
  getUserRecommendations: vi.fn().mockResolvedValue({
    dailyPick: null,
    needsReview: [],
    recommended: [],
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Home', () => {
  it('renders the home page', async () => {
    const ui = await Home();
    render(ui);
    // Use accessible name which combines text across child elements
    expect(screen.getByRole('heading', { level: 1, name: /Master Systems/i })).toBeDefined();
  });
});
