'use client';

import { SystemDesignProblem } from '@/types';

interface ProblemCardProps {
  problem: SystemDesignProblem;
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-xl font-semibold mb-2 text-black">{problem.title}</h3>
      <p className="text-gray-600 mb-4 line-clamp-2">{problem.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
        {problem.companies.slice(0, 3).map(c => (
          <span key={c} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
            {c}
          </span>
        ))}
      </div>
      <a
        href={`/practice/${problem.slug}`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200"
      >
        Practice Now
      </a>
    </div>
  );
}