import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PracticeAloudToggle } from '@/components/PracticeAloudToggle';

describe('PracticeAloudToggle', () => {
  it('renders off by default', () => {
    render(<PracticeAloudToggle enabled={false} entitled onEnabledChange={vi.fn()} />);
    expect(screen.getByRole('switch').getAttribute('data-state')).toBe('unchecked');
  });

  it('shows first-use explainer when not seen', () => {
    localStorage.clear();
    render(<PracticeAloudToggle enabled={false} entitled onEnabledChange={vi.fn()} />);
    expect(screen.getByText(/answer out loud/i)).toBeTruthy();
  });
});
