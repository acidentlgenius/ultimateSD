import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: null }),
}));

describe('Home', () => {
  it('renders the home page', async () => {
    const Component = await Home();
    render(Component as any);
    // Use accessible name which combines text across child elements
    expect(screen.getByRole('heading', { level: 1, name: /Master Systems/i })).toBeDefined();
  });
});
