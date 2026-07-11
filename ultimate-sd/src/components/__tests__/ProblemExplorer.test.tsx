import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { expect, test, vi, describe } from 'vitest';
import { ProblemExplorer } from '../ProblemExplorer';
import type { SystemDesignProblem } from '@/types';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/components/ProblemCard', () => ({
    default: ({ problem }: any) => <div data-testid="problem-card">{problem.title}</div>,
}));

vi.mock('@/components/ProModal', () => ({
    ProModal: () => <div data-testid="pro-modal">Pro Modal Mock</div>,
}));

vi.mock('@/components/ui/progress', () => ({
    Progress: () => <div data-testid="progress">Progress Mock</div>,
}));

const mockProblems: SystemDesignProblem[] = [
    {
        id: '1',
        slug: 'design-rate-limiter',
        title: 'Design a Rate Limiter',
        description: 'Design a highly scalable API rate limiter.',
        difficulty: 'Medium',
        category: 'API Design',
        status: 'completed',
        progress: 100,
        tags: ['API', 'Scalability'],
        companies: ['Stripe', 'Google']
    },
    {
        id: '2',
        slug: 'design-twitter',
        title: 'Design Twitter',
        description: 'Design a social media platform like Twitter.',
        difficulty: 'Hard',
        category: 'Social Network',
        status: 'not_started',
        progress: 0,
        tags: ['Social', 'Feed'],
        companies: ['Twitter', 'Meta']
    }
];

describe('ProblemExplorer', () => {
    test('renders and filters problems using search input', async () => {
        render(<ProblemExplorer problems={mockProblems} />);

        // Wait for deferred value to settle and render initial items
        await waitFor(() => {
            expect(screen.getAllByTestId('problem-card')).toHaveLength(2);
        });

        const searchInput = screen.getByPlaceholderText('Search problems...');

        // Type into search
        act(() => {
            fireEvent.change(searchInput, { target: { value: 'Rate Limiter' } });
        });

        // Wait for deferred value to filter the results
        await waitFor(() => {
            expect(screen.getAllByTestId('problem-card')).toHaveLength(1);
            expect(screen.getByText('Design a Rate Limiter')).toBeInTheDocument();
        });
    });
});
