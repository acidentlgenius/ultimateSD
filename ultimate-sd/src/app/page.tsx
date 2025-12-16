'use client';

import { PROBLEMS } from '@/lib/problems';
import ProblemCard from '@/components/ProblemCard';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, Award, Zap, Pencil, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
    { icon: Award, label: 'Total Problems', value: PROBLEMS.length, color: 'text-blue-500' },
    { icon: TrendingUp, label: 'Categories', value: categories.length - 1, color: 'text-green-500' },
    { icon: Zap, label: 'Active Users', value: '1,240+', color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 space-y-8 animate-fade-in">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                New Problems Added Weekly
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                Master <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                  System Design
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                The most advanced AI-powered platform to practice real-world system design problems from top tech companies.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="#problems">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    Start Practicing
                  </Button>
                </Link>
                <Link href="/draw">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base border-primary/20 hover:bg-primary/5">
                    <Pencil className="mr-2 h-4 w-4" />
                    Free Draw
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <stat.icon className={`h-4 w-4 mr-2 ${stat.color}`} />
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 relative animate-slide-in lg:block hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" />
              <div className="relative glass-card p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Mockup of a system design diagram or interface */}
                <div className="bg-background/80 rounded-lg p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="ml-auto text-xs text-muted-foreground">System Architecture.excalidraw</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-center gap-8">
                      <div className="w-24 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-medium">Load Balancer</div>
                    </div>
                    <div className="flex justify-center">
                      <div className="h-8 w-px bg-border" />
                    </div>
                    <div className="flex justify-center gap-8">
                      <div className="w-24 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-center text-xs font-medium">App Server 1</div>
                      <div className="w-24 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-center text-xs font-medium">App Server 2</div>
                    </div>
                    <div className="flex justify-center">
                      <div className="h-8 w-px bg-border" />
                    </div>
                    <div className="flex justify-center gap-8">
                      <div className="w-24 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center justify-center text-xs font-medium">Database</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Badges */}
              <div className="absolute -top-6 -right-6 glass px-4 py-2 rounded-lg text-sm font-medium animate-float shadow-lg">
                High Availability
              </div>
              <div className="absolute -bottom-8 -left-6 glass px-4 py-2 rounded-lg text-sm font-medium animate-float shadow-lg" style={{ animationDelay: '1.5s' }}>
                Scalable Design
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 z-20 relative -mt-8 mb-16 flex justify-end">
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div id="problems" className="container mx-auto px-4 pb-24 relative z-10">

        {/* Search Bar */}
        <div className="glass-card p-4 mb-12 shadow-xl shadow-indigo-500/5 border-primary/10 mx-auto max-w-4xl -mt-12">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-12 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full pl-9 pr-4 h-12 bg-transparent outline-none appearance-none cursor-pointer"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="relative w-full md:w-40">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full pl-8 pr-4 h-12 bg-transparent outline-none appearance-none cursor-pointer"
                >
                  {difficulties.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Problems Grid */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Practice Problems</h2>
            <p className="text-muted-foreground hidden md:block">
              {filtered.length} problems available
            </p>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((problem, index) => (
                <div
                  key={problem.id}
                  className="animate-slide-up group"
                  style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                >
                  <ProblemCard problem={problem} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center shadow-inner">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No problems found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                We couldn't find any problems matching your search criteria.
              </p>
              <Button
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                  setDifficulty('All');
                }}
                variant="outline"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-24 rounded-3xl relative overflow-hidden bg-primary px-6 py-16 md:px-16 md:py-20 text-center shadow-2xl shadow-primary/30">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-[80px]" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">Ready to start designing?</h2>
            <p className="text-primary-foreground/80 text-lg">
              Use our free drawing canvas to verify your architectural ideas with minimal friction.
            </p>
            <Link href="/draw">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg border-0 h-12 px-8 font-semibold">
                Launch Canvas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
