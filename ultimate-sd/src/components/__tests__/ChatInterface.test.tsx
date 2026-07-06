import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from '../ChatInterface';
import { vi } from 'vitest';

const mockProblem = {
  slug: 'tinyurl',
  title: 'Design TinyURL',
  context: 'Shorten URLs',
};

describe('ChatInterface', () => {
  beforeEach(() => {
    // mock fetch to return a simple AI response
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ messages: [{ role: 'ai', content: 'OK', id: '1', timestamp: new Date() }], phase: 'requirements' }) })) as any;
  });

  it('renders initial AI prompt', async () => {
    render(<ChatInterface problem={mockProblem as any} />);
    expect(screen.getByText(/Start by clarifying requirements/i)).toBeInTheDocument();
  });
});
