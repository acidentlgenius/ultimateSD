import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero fresher split CTA', () => {
  it('renders no fresher CTA by default (flag dark = zero visual change)', () => {
    render(<Hero />);
    expect(screen.queryByText(/Fresher Path/i)).toBeNull();
  });

  it('renders no fresher CTA when showFresherPath is false', () => {
    render(<Hero showFresherPath={false} />);
    expect(screen.queryByText(/Fresher Path/i)).toBeNull();
  });

  it('renders the split CTA linking to the fresher roadmap when allowed', () => {
    render(<Hero showFresherPath />);
    const cta = screen.getByRole('link', { name: /Starting from zero\? Fresher Path/i });
    expect(cta.getAttribute('href')).toBe('/roadmap?track=fresher');
  });

  it('keeps the senior CTAs regardless of the flag', () => {
    render(<Hero showFresherPath />);
    expect(screen.getByRole('link', { name: /Start Exploring/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Free Canvas/i })).toBeTruthy();
  });
});
