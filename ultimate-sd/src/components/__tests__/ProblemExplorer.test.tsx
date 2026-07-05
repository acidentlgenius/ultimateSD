import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ProblemExplorer } from '../ProblemExplorer';
import { ProblemWithStatus } from '@/types';

// Mock the child components to simplify the test
vi.mock('@/components/ProblemCard', () => ({
    default: ({ problem }: { problem: any }) => <div data-testid="problem-card">{problem.title}</div>
}));

vi.mock('@/components/landing/ProblemFilterBar', () => ({
    ProblemFilterBar: ({ search, setSearch, category, setCategory, difficulty, setDifficulty }: any) => (
        <div data-testid="filter-bar">
            <input
                data-testid="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <select
                data-testid="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value="All">All</option>
                <option value="Basics">Basics</option>
                <option value="Core Services">Core Services</option>
            </select>
            <select
                data-testid="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
            >
                <option value="All">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
            </select>
        </div>
    )
}));

// Mock ResizeObserver for Recharts / Radix components that might need it deep down
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const mockProblems: ProblemWithStatus[] = [
    {
        id: '1',
        title: 'Design TinyURL',
        slug: 'design-tinyurl',
        description: 'A URL shortening service.',
        difficulty: 'Easy',
        category: 'Basics',
        companies: [],
        requirements: []
    },
    {
        id: '2',
        title: 'Design YouTube',
        slug: 'design-youtube',
        description: 'Video streaming platform.',
        difficulty: 'Medium',
        category: 'Core Services',
        companies: [],
        requirements: []
    },
    {
        id: '3',
        title: 'Design Uber',
        slug: 'design-uber',
        description: 'Ride-sharing app.',
        difficulty: 'Hard',
        category: 'Core Services',
        companies: [],
        requirements: []
    }
];

describe('ProblemExplorer', () => {
    it('renders heading and subheading when showHeading is true', () => {
        render(<ProblemExplorer problems={mockProblems} heading="Test Heading" subheading="Test Subheading" />);
        expect(screen.getByText('Test Heading')).toBeInTheDocument();
        expect(screen.getByText('Test Subheading')).toBeInTheDocument();
    });

    it('renders all problems initially', () => {
        render(<ProblemExplorer problems={mockProblems} />);
        expect(screen.getByText('Design TinyURL')).toBeInTheDocument();
        expect(screen.getByText('Design YouTube')).toBeInTheDocument();
        expect(screen.getByText('Design Uber')).toBeInTheDocument();
    });

    it('filters problems by search text (deferred value)', async () => {
        const user = userEvent.setup();
        render(<ProblemExplorer problems={mockProblems} />);

        const searchInput = screen.getByTestId('search-input');

        await act(async () => {
            await user.type(searchInput, 'youtube');
        });

        // Wait for deferred value to update
        expect(screen.getByText('Design YouTube')).toBeInTheDocument();
        expect(screen.queryByText('Design TinyURL')).not.toBeInTheDocument();
        expect(screen.queryByText('Design Uber')).not.toBeInTheDocument();
    });

    it('filters problems by category without clearing search index if search is empty', async () => {
        const user = userEvent.setup();
        render(<ProblemExplorer problems={mockProblems} />);

        const categorySelect = screen.getByTestId('category-select');

        await act(async () => {
            await user.selectOptions(categorySelect, 'Basics');
        });

        expect(screen.getByText('Design TinyURL')).toBeInTheDocument();
        expect(screen.queryByText('Design YouTube')).not.toBeInTheDocument();
        expect(screen.queryByText('Design Uber')).not.toBeInTheDocument();
    });

    it('shows empty state when no problems match filters', async () => {
        const user = userEvent.setup();
        render(<ProblemExplorer problems={mockProblems} />);

        const searchInput = screen.getByTestId('search-input');

        await act(async () => {
            await user.type(searchInput, 'nonexistentproblem');
        });

        expect(screen.getByText('No challenges found')).toBeInTheDocument();
    });
});
