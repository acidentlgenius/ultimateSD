import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home', () => {
  it('renders the home page', () => {
    render(<Home />);
    // Use accessible name which combines text across child elements
    expect(screen.getByRole('heading', { level: 1, name: /Master Systems/i })).toBeDefined();
  });
});