'use client';

import { PROBLEMS } from '@/lib/problems';
import ProblemCard from '@/components/ProblemCard';
import { useState, useMemo } from 'react';

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    let filteredProblems = PROBLEMS;

    if (category !== 'All') {
      filteredProblems = filteredProblems.filter(p => p.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProblems = filteredProblems.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    return filteredProblems;
  }, [search, category]);

  const categories = ['All', ...new Set(PROBLEMS.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-black">Practice System Design Interviews</h1>
        <p className="text-lg mb-4 text-gray-700">AI-powered mocks like HelloInterview. Select a problem to start.</p>
        {/* Search/Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(problem => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No problems found matching your criteria.</p>
        )}
      </div>
    </div>
  );
}
