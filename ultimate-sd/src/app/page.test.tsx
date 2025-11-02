import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home', () => {
  it('renders the home page', () => {
    render(<Home />);
    expect(screen.getByText('Master System Design')).toBeDefined();
  });
});