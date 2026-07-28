import React from 'react';
import { vi } from 'vitest';
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

  it('renders tags as non-interactive on a locked card, so clicking near a tag does not swallow the unlock click', () => {
    render(
      <ProblemCard
        problem={{ ...mockProblem, tags: ['geospatial'] } as any}
        locked
        onLockedClick={vi.fn()}
        onTagClick={vi.fn()}
      />
    );
    // The only "button" role on a locked card must be the card's own unlock
    // overlay — a nested clickable tag badge would stopPropagation() and
    // silently swallow clicks meant for onLockedClick (the bug this guards).
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName(/Unlock Design TinyURL/i);
    expect(screen.getByText('geospatial')).toBeInTheDocument();
  });
});
