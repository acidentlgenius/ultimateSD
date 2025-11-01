import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders the home page', () => {
    render(<Home />);
    expect(screen.getByText('Practice System Design Interviews')).toBeDefined();
  });
});