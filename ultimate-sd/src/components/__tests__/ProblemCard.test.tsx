import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProblemCard from '../ProblemCard';

const mockProblem = {
  slug: 'tinyurl',
  title: 'Design TinyURL',
  context: 'Shorten URLs',
  difficulty: 'Easy',
  companies: ['Google', 'Facebook']
};

describe('ProblemCard', () => {
  it('renders title, description and practice link', () => {
    render(<ProblemCard problem={mockProblem as any} />);
    expect(screen.getByText(/Design TinyURL/i)).toBeInTheDocument();
    expect(screen.getByText(/Shorten URLs/i)).toBeInTheDocument();
    expect(screen.getByText(/Practice/i)).toBeInTheDocument();
  });
});
