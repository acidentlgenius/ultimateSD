'use client';

import { PROBLEMS } from '@/lib/problems';
import ProblemCard from '@/components/ProblemCard';
import { useState, useMemo } from 'react';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/landing/Hero';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { RoadmapPreview } from '@/components/landing/RoadmapPreview';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">

      {/* 1. High Impact Hero */}
      <Hero />

      {/* 2. Interactive Feature Showcase */}
      <FeatureShowcase />

      {/* 2.5 Roadmap Preview */}
      <RoadmapPreview />

      {/* 3. Problem Explorer (Existing Logic, Refined UI) */}
      <div id="problems" className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Start Practicing</h2>
          <p className="text-lg text-muted-foreground">Pick a real-world problem and start designing.</p>
        </div>

        {/* Search Bar - Refined */}
        <div className="sticky top-20 z-40 backdrop-blur-md bg-background/80 rounded-2xl border border-white/10 shadow-xl mb-12 max-w-4xl mx-auto transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50">
          <div className="p-2 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems (e.g., 'Uber', 'Chat', 'Cache')..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-12 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70 rounded-xl hover:bg-muted/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative md:w-48 w-full">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-12 px-4 bg-muted/30 border-0 rounded-xl outline-none cursor-pointer hover:bg-muted/50 transition-colors appearance-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative md:w-40 w-full">
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full h-12 px-4 bg-muted/30 border-0 rounded-xl outline-none cursor-pointer hover:bg-muted/50 transition-colors appearance-none"
                >
                  {difficulties.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Problems Grid */}
        <div className="min-h-[400px]">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((problem, index) => (
                <div
                  key={problem.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                >
                  <ProblemCard problem={problem} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No problems found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters.
              </p>
              <Button
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                  setDifficulty('All');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-32 rounded-3xl relative overflow-hidden bg-gradient-to-br from-primary to-purple-700 px-6 py-20 text-center shadow-2xl shadow-primary/20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white">Ready to Design?</h2>
            <p className="text-white/80 text-lg md:text-xl font-light">
              Your journey to mastering distributed systems starts with a single component.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link href="/draw">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl border-0 h-14 px-8 font-bold text-lg rounded-full">
                  Launch Canvas <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Placeholder */}
      <footer className="py-12 border-t border-border/40 bg-muted/5 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Ultimate SD. Built for Engineers.</p>
      </footer>
    </div>
  );
}
