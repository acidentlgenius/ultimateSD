'use client';

import { PROBLEMS } from '@/lib/problems';
import ProblemCard from '@/components/ProblemCard';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, Award, Zap, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const filtered = useMemo(() => {
    let filteredProblems = PROBLEMS;

    if (category !== 'All') {
      filteredProblems = filteredProblems.filter(p => p.category === category);
    }

    if (difficulty !== 'All') {
      filteredProblems = filteredProblems.filter(p => p.difficulty === difficulty);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProblems = filteredProblems.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.companies.some(c => c.toLowerCase().includes(searchLower))
      );
    }

    return filteredProblems;
  }, [search, category, difficulty]);

  const categories = ['All', ...new Set(PROBLEMS.map(p => p.category))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const stats = [
    { icon: Award, label: 'Total Problems', value: PROBLEMS.length, color: 'text-blue-600' },
    { icon: TrendingUp, label: 'Categories', value: categories.length - 1, color: 'text-green-600' },
    { icon: Zap, label: 'Active Users', value: '1.2k+', color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-fade-in">
              <h1 className="text-5xl font-bold mb-3 gradient-text">
                Master System Design
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                AI-powered practice platform with 80+ real-world problems from top tech companies
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/draw">
                <Button className="gradient-bg shadow-lg hover:shadow-xl transition-all">
                  <Pencil className="h-4 w-4 mr-2" />
                  Free Draw
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-in">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass rounded-xl p-6 card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color === 'text-blue-600' ? 'from-blue-100 to-blue-200' : stat.color === 'text-green-600' ? 'from-green-100 to-green-200' : 'from-purple-100 to-purple-200'}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Free Draw Feature Banner */}
          <Link href="/draw">
            <div className="mb-12 glass rounded-xl p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 card-hover animate-fade-in cursor-pointer group">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg group-hover:scale-110 transition-transform">
                  <Pencil className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 gradient-text">Free Drawing Canvas</h2>
                  <p className="text-muted-foreground mb-3">
                    Create custom HLD or LLD diagrams with our powerful drawing tools. Perfect for practicing or planning your own system designs.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      No practice problem required
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Export as PNG
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Full component library
                    </span>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <Button size="lg" className="gradient-bg shadow-lg group-hover:shadow-xl">
                    Start Drawing
                    <Pencil className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Enhanced Search/Filter */}
          <div className="glass rounded-xl p-6 mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by problem, company, or keyword..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background/50 backdrop-blur-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="pl-9 pr-8 py-3 border border-input bg-background/50 backdrop-blur-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer transition-all min-w-[150px]"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="px-4 py-3 border border-input bg-background/50 backdrop-blur-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer transition-all min-w-[120px]"
                >
                  {difficulties.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                </select>
              </div>
            </div>
            {(search || category !== 'All' || difficulty !== 'All') && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {filtered.length} of {PROBLEMS.length} problems</span>
                {(search || category !== 'All' || difficulty !== 'All') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setCategory('All');
                      setDifficulty('All');
                    }}
                    className="text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Problems Grid */}
      <div className="container mx-auto px-4 pb-16">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((problem, index) => (
              <div
                key={problem.id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <ProblemCard problem={problem} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No problems found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setDifficulty('All');
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
