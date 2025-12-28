'use client';

import { PROBLEMS } from '@/lib/problems';
import ProblemCard from '@/components/ProblemCard';
import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, Building2, TrendingUp } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { tokens } from '@/styles/tokens';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/landing/Hero';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { RoadmapPreview } from '@/components/landing/RoadmapPreview';

import Link from 'next/link';
import OnboardingModal from '@/components/OnboardingModal';
import { ProblemWithStatus } from '@/types';
import { UserHero } from '@/components/landing/UserHero';
import { ProblemFilterBar } from '@/components/landing/ProblemFilterBar';

interface DashboardClientProps {
    user?: {
        id?: string;
        name?: string | null;
        xp?: number;
        level?: number;
        streak?: number;
    };
    recommendations?: {
        dailyPick: ProblemWithStatus | null;
        needsReview: ProblemWithStatus[];
        recommended: ProblemWithStatus[];
    };
    onboardingCompleted?: boolean;
}

export function DashboardClient({ user, recommendations, onboardingCompleted = false }: DashboardClientProps) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [difficulty, setDifficulty] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [showOnboarding, setShowOnboarding] = useState(!!(user && !onboardingCompleted));


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
            {user && (
                <OnboardingModal
                    isOpen={showOnboarding}
                    onClose={() => setShowOnboarding(false)}
                    userId={user.id!}
                />
            )}

            {/* 1. High Impact Hero - Personalized if Logged In */}
            {user ? (
                <UserHero
                    user={user}
                    recommendations={recommendations}
                    setShowOnboarding={setShowOnboarding}
                />
            ) : (
                <Hero />
            )}

            {/* 2. Interactive Feature Showcase (Hide if logged in) */}
            {!user && <FeatureShowcase />}

            {/* 2.5 Roadmap Preview */}
            {!user && <RoadmapPreview />}



            {/* 3. Problem Explorer */}
            <div id="problems" className="container mx-auto px-4 py-12 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{user ? 'All Challenges' : 'Start Practicing'}</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Pick a real-world problem and start designing. Master the patterns used by top tech companies.
                    </p>
                </div>

                <ProblemFilterBar
                    search={search}
                    setSearch={setSearch}
                    category={category}
                    setCategory={setCategory}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    categories={categories}
                    difficulties={difficulties}
                    user={user}
                />

                {/* Problems Grid */}
                <div className="min-h-[400px]">
                    {filtered.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                            <div className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm overflow-hidden animate-slide-up">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/50 border-white/5">
                                            <TableHead className="w-[40%] font-semibold">Problem</TableHead>
                                            <TableHead className="font-semibold">Difficulty</TableHead>
                                            <TableHead className="font-semibold">Category</TableHead>
                                            <TableHead className="hidden md:table-cell font-semibold">Companies</TableHead>
                                            <TableHead className="text-right font-semibold">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map((problem) => (
                                            <TableRow key={problem.id} className="group hover:bg-blue-500/5 transition-colors border-white/5">
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="text-base group-hover:text-primary transition-colors">{problem.title}</span>
                                                        <span className="text-xs text-muted-foreground line-clamp-1 font-normal md:hidden">{problem.category}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        style={{
                                                            backgroundColor: problem.difficulty === 'Easy' ? tokens.colors.difficulty.easy :
                                                                problem.difficulty === 'Medium' ? tokens.colors.difficulty.medium :
                                                                    tokens.colors.difficulty.hard,
                                                            color: 'white'
                                                        }}
                                                        className="font-semibold shadow-sm border-0"
                                                    >
                                                        {problem.difficulty}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <div className="p-1 rounded bg-muted/50">
                                                            <TrendingUp className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span>{problem.category}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {problem.companies.length > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground/50" />
                                                            <div className="flex -space-x-2 hover:space-x-0 transition-all duration-300">
                                                                {Array.from(new Set(problem.companies)).slice(0, 3).map(c => (
                                                                    <div key={c} className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground shadow-sm relative z-10 hover:z-20 hover:scale-110 transition-transform cursor-help" title={c}>
                                                                        {c[0]}
                                                                    </div>
                                                                ))}
                                                                {Array.from(new Set(problem.companies)).length > 3 && (
                                                                    <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground shadow-sm z-0">
                                                                        +{Array.from(new Set(problem.companies)).length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/practice/${problem.slug}`}>
                                                        <Button size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary font-medium group-hover:translate-x-1 transition-all rounded-full">
                                                            Practice <ArrowRight className="ml-1 h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center animate-pulse">
                                <Search className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No problems found</h3>
                            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                    We couldn&apos;t find any challenges matching your filters. Try adjusting your search or filters.
                                </p>
                            </p>
                            <Button
                                onClick={() => {
                                    setSearch('');
                                    setCategory('All');
                                    setDifficulty('All');
                                }}
                                variant="outline"
                                className="border-dashed"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* CTA Section - Hide if logged in */}
                {!user && (
                    <div className="mt-32 rounded-[2.5rem] relative overflow-hidden bg-gradient-to-br from-primary to-purple-700 px-6 py-24 text-center shadow-2xl shadow-primary/20">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/10 blur-[120px] rounded-full pointer-events-none" />

                        <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Ready to Design?</h2>
                            <p className="text-white/80 text-xl font-light leading-relaxed">
                                Your journey to mastering distributed systems starts with a single component. Join thousands of engineers growing today.
                            </p>
                            <div className="pt-6 flex justify-center gap-4">
                                <Link href="/draw">
                                    <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/10 border-0 h-16 px-10 font-bold text-lg rounded-full transition-transform hover:-translate-y-1">
                                        Launch Canvas <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Placeholder */}
            <footer className="py-12 border-t border-border/40 bg-muted/5 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Ultimate SD. Built for Engineers.</p>
            </footer>
        </div>
    );
}
