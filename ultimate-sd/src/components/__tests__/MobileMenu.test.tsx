import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileMenu } from '@/components/MobileMenu';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('MobileMenu overlay', () => {
  // The header uses backdrop-filter, which makes it the containing block for
  // fixed-position descendants. The open drawer must therefore be portaled to
  // document.body, or it gets confined to the 64px header box.
  it('renders the open drawer outside the header subtree', () => {
    const { container } = render(<MobileMenu />);

    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(container.contains(homeLink)).toBe(false);
    expect(document.body.contains(homeLink)).toBe(true);
  });

  it('closes the drawer when the backdrop is clicked', async () => {
    render(<MobileMenu />);

    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
    fireEvent.click(screen.getByTestId('mobile-menu-backdrop'));

    // AnimatePresence keeps the drawer mounted until the exit animation ends.
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /home/i })).toBeNull();
    });
  });
});
