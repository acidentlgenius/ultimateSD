'use client';

import { PROBLEMS } from '@/lib/problems';
import ProblemCard from '@/components/ProblemCard';
import { useState, useMemo } from 'react';
import { Search, ArrowRight, Building2, TrendingUp, Lock, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ProgressStatus } from '@/types';
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
import { UserHero } from '@/components/landing/UserHero';
import { LaunchOfferSection } from '@/components/landing/LaunchOfferSection';
import type { LaunchOfferPublicStats, LaunchOfferUserState } from '@/lib/launch-offer';

import Link from 'next/link';
import OnboardingModal from '@/components/OnboardingModal';
import { ProblemWithStatus } from '@/types';
import { ProblemFilterBar } from '@/components/landing/ProblemFilterBar';
import { cn } from '@/lib/utils';
import { canAccessProblem } from '@/lib/access';
import { ProModal } from '@/components/ProModal';
import { type PlanType } from '@/lib/plans';
import { getAllFilterTags, getProblemTags, problemMatchesTag } from '@/lib/problem-tags';
import { ProblemTagList } from '@/components/ProblemTagBadge';

type StatusFilter =
    | 'All'
    | 'Not Started'
    | 'Attempted'
    | 'In Progress'
    | 'Completed'
    | 'Review Due';

interface DashboardClientProps {
    user?: {
        id?: string;
        name?: string | null;
        xp?: number;
        level?: number;
        streak?: number;
        planType?: PlanType;
        hasPlatformPlan?: boolean;
        planExpiresAt?: string | null;
    };
    recommendations?: {
        dailyPick: ProblemWithStatus | null;
        needsReview: ProblemWithStatus[];
        recommended: ProblemWithStatus[];
    };
    onboardingCompleted?: boolean;
    problems?: ProblemWithStatus[];
    launchStats?: LaunchOfferPublicStats;
    launchUserState?: LaunchOfferUserState | null;
}

function getStatusBadgeConfig(status?: ProgressStatus) {
    switch (status) {
        case 'COMPLETED':
            return { icon: CheckCircle, label: 'Completed', className: 'border-green-500/30 text-green-600 bg-green-500/10' };
        case 'REVIEW_NEEDED':
            return { icon: RotateCcw, label: 'Review Due', className: 'border-amber-500/30 text-amber-600 bg-amber-500/10' };
        case 'IN_PROGRESS':
            return { icon: Clock, label: 'In Progress', className: 'border-blue-500/30 text-blue-600 bg-blue-500/10' };
        case 'NOT_STARTED':
        case undefined:
            return null;
        default: {
            const _exhaustive: never = status;
            return _exhaustive;
        }
    }
}

function matchesStatusFilter(
    problem: ProblemWithStatus,
    filter: StatusFilter
): boolean {
    if (filter === 'All') return true;

    const status = problem.status;
    switch (filter) {
        case 'Not Started':
            return !status || status === 'NOT_STARTED';
        case 'Attempted':
            return (
                (problem.totalAttempts ?? 0) > 0 &&
                status !== 'COMPLETED' &&
                status !== 'REVIEW_NEEDED'
            );
        case 'In Progress':
            return status === 'IN_PROGRESS';
        case 'Completed':
            return status === 'COMPLETED';
        case 'Review Due':
            return status === 'REVIEW_NEEDED';
        default: {
            const _exhaustive: never = filter;
            return _exhaustive;
        }
    }
}

export function DashboardClient({
    user,
    recommendations,
    onboardingCompleted = false,
    problems: problemsProp,
    launchStats,
    launchUserState = null,
}: DashboardClientProps) {
    const problems: ProblemWithStatus[] = problemsProp ?? PROBLEMS;
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [difficulty, setDifficulty] = useState('All');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [topicFilter, setTopicFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [lockedProblem, setLockedProblem] = useState<ProblemWithStatus | null>(null);

    const [showOnboarding, setShowOnboarding] = useState(!!(user && !onboardingCompleted));

    const accessUser = user?.id ? {
        planType: user.planType ?? 'free',
        planExpiresAt: user.planExpiresAt ? new Date(user.planExpiresAt) : null,
    } : null;

    const isProblemLocked = (slug: string) => !canAccessProblem(accessUser, slug);

    const topicOptions = useMemo(() => getAllFilterTags(problems), [problems]);

    const handleTagClick = (tagId: string) => {
        setTopicFilter(tagId);
        document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' });
    };

    const filtered = useMemo(() => {
        let filteredProblems = problems;

        if (category !== 'All') {
            filteredProblems = filteredProblems.filter(p => p.category === category);
        }

        if (difficulty !== 'All') {
            filteredProblems = filteredProblems.filter(p => p.difficulty === difficulty);
        }

        if (user && statusFilter !== 'All') {
            filteredProblems = filteredProblems.filter((p) =>
                matchesStatusFilter(p, statusFilter)
            );
        }

        if (topicFilter !== 'All') {
            filteredProblems = filteredProblems.filter((p) =>
                problemMatchesTag(p.slug, p.tags, topicFilter)
            );
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filteredProblems = filteredProblems.filter(p => {
                const tagLabels = getProblemTags(p.slug, p.tags)
                    .map((t) => t.label.toLowerCase())
                    .join(' ');
                return (
                    p.title.toLowerCase().includes(searchLower) ||
                    p.description.toLowerCase().includes(searchLower) ||
                    p.companies.some(c => c.toLowerCase().includes(searchLower)) ||
                    tagLabels.includes(searchLower)
                );
            });
        }

        return filteredProblems;
    }, [problems, search, category, difficulty, statusFilter, topicFilter, user]);

    const categories = ['All', ...new Set(problems.map(p => p.category))];
    const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            <ProModal
                isOpen={Boolean(lockedProblem)}
                onClose={() => setLockedProblem(null)}
                problemTitle={lockedProblem?.title}
            />
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
                <Hero launchStats={launchStats?.isActive ? launchStats : undefined} />
            )}

            {launchStats?.isActive && (
                <LaunchOfferSection
                    stats={launchStats}
                    userState={launchUserState}
                    isLoggedIn={Boolean(user)}
                />
            )}

            {/* 2. Interactive Feature Showcase (Hide if logged in) */}
            {!user && <FeatureShowcase />}

            {/* 2.5 Roadmap Preview */}
            <RoadmapPreview />

            {/* 3. Problem Explorer */}
            <div id="problems" className="container mx-auto px-4 py-24 relative z-10 max-w-7xl">
                <div className="text-center mb-20 space-y-6">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                        {user ? 'All Challenges' : 'Start Practicing'}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Pick a real-world problem and start designing. Master the patterns used by top tech companies.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex-1 w-full">
                        <ProblemFilterBar
                            search={search}
                            setSearch={setSearch}
                            category={category}
                            setCategory={setCategory}
                            difficulty={difficulty}
                            setDifficulty={setDifficulty}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            showStatusFilter={!!user}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            categories={categories}
                            difficulties={difficulties}
                            topicFilter={topicFilter}
                            setTopicFilter={setTopicFilter}
                            topicOptions={topicOptions}
                            user={user}
                        />
                    </div>
                    <Link href="/custom">
                        <Button className="shrink-0 h-12 px-6 rounded-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                            <span className="mr-2">✨</span> Design Custom Problem
                        </Button>
                    </Link>
                </div>

                {/* Problems Grid */}
                <div className="min-h-[500px]">
                    {filtered.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                                {filtered.map((problem, index) => (
                                    <div
                                        key={problem.id}
                                        className="animate-slide-up h-full"
                                        style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                                    >
                                        <ProblemCard
                                            problem={problem}
                                            locked={isProblemLocked(problem.slug)}
                                            onLockedClick={setLockedProblem}
                                            onTagClick={handleTagClick}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-white/5 overflow-hidden animate-slide-up">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-black/5 dark:border-white/5 hover:bg-transparent">
                                            <TableHead className="w-[35%] font-semibold pl-6 h-14">Problem</TableHead>
                                            <TableHead className="font-semibold h-14">Difficulty</TableHead>
                                            {user && <TableHead className="font-semibold h-14">Status</TableHead>}
                                            {user && <TableHead className="font-semibold h-14">Progress</TableHead>}
                                            <TableHead className="font-semibold h-14">Category</TableHead>
                                            <TableHead className="hidden md:table-cell font-semibold h-14">Tags</TableHead>
                                            <TableHead className="hidden md:table-cell font-semibold h-14">Companies</TableHead>
                                            <TableHead className="text-right font-semibold pr-6 h-14">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map((problem) => (
                                            <TableRow key={problem.id} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-black/5 dark:border-white/5">
                                                <TableCell className="font-medium pl-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-base font-bold group-hover:text-primary transition-colors">{problem.title}</span>
                                                        <span className="text-xs text-muted-foreground md:hidden">{problem.category}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "font-semibold border bg-opacity-10",
                                                            problem.difficulty === 'Easy' ? 'border-green-500/30 text-green-500 bg-green-500/10' :
                                                                problem.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' :
                                                                    'border-red-500/30 text-red-500 bg-red-500/10'
                                                        )}
                                                    >
                                                        {problem.difficulty}
                                                    </Badge>
                                                </TableCell>
                                                {user && (
                                                    <TableCell className="py-4">
                                                        {(() => {
                                                            const statusConfig = getStatusBadgeConfig(problem.status);
                                                            if (!statusConfig) {
                                                                return <span className="text-xs text-muted-foreground">—</span>;
                                                            }
                                                            const StatusIcon = statusConfig.icon;
                                                            return (
                                                                <Badge variant="outline" className={cn("font-semibold gap-1 shadow-none", statusConfig.className)}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {statusConfig.label}
                                                                </Badge>
                                                            );
                                                        })()}
                                                    </TableCell>
                                                )}
                                                {user && (
                                                    <TableCell className="py-4">
                                                        {problem.progress != null && problem.progress > 0 ? (
                                                            <div className="flex items-center gap-2 w-24">
                                                                <Progress value={problem.progress} className="h-1.5 flex-1 bg-secondary/80" />
                                                                <span className="text-[10px] font-bold text-muted-foreground w-8">
                                                                    {Math.round(problem.progress)}%
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                        <TrendingUp className="h-4 w-4 opacity-50" />
                                                        <span>{problem.category}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell py-4">
                                                    <ProblemTagList
                                                        slug={problem.slug}
                                                        legacyTags={problem.tags}
                                                        limit={3}
                                                        onTagClick={handleTagClick}
                                                    />
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell py-4">
                                                    {problem.companies.length > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Building2 className="h-4 w-4 text-muted-foreground/40" />
                                                            <div className="flex -space-x-2 hover:space-x-1 transition-all duration-300">
                                                                {Array.from(new Set(problem.companies)).slice(0, 3).map(c => (
                                                                    <div key={c} className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground shadow-sm relative z-10 hover:z-20 hover:scale-110 transition-transform cursor-help" title={c}>
                                                                        {c[0]}
                                                                    </div>
                                                                ))}
                                                                {Array.from(new Set(problem.companies)).length > 3 && (
                                                                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm z-0">
                                                                        +{Array.from(new Set(problem.companies)).length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 py-4">
                                                    {isProblemLocked(problem.slug) ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="hover:bg-amber-500/10 hover:text-amber-600 font-bold rounded-full h-9 px-4"
                                                            onClick={() => setLockedProblem(problem)}
                                                        >
                                                            Unlock <Lock className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Link href={`/practice/${problem.slug}`}>
                                                            <Button size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary font-bold rounded-full h-9 px-4 group-hover:translate-x-1 transition-all">
                                                                Practice <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-24 bg-card/30 backdrop-blur-md rounded-3xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center">
                            <div className="w-24 h-24 mb-6 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
                                <Search className="h-10 w-10 text-primary/40" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">No challenges found</h3>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                                We couldn&apos;t find any design problems matching your criteria. Try adjusting your filters to see more results.
                            </p>
                            <Button
                                onClick={() => {
                                    setSearch('');
                                    setCategory('All');
                                    setDifficulty('All');
                                    setStatusFilter('All');
                                }}
                                variant="outline"
                                size="lg"
                                className="border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* CTA Section - Hide if logged in */}
                {!user && (
                    <div className="mt-32 rounded-[3rem] relative overflow-hidden bg-gradient-to-br from-primary to-purple-700 px-6 py-24 text-center shadow-2xl shadow-primary/30">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-black/10 dark:bg-white/10 blur-[120px] rounded-full pointer-events-none" />

                        <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Ready to Design?</h2>
                            <p className="text-white/80 text-xl font-light leading-relaxed">
                                Your journey to mastering distributed systems starts with a single component. Try the free canvas or start with TinyURL today.
                            </p>
                            <div className="pt-6 flex justify-center gap-4">
                                <Link href="/draw">
                                    <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20 border-0 h-16 px-10 font-bold text-lg rounded-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
                                        Launch Canvas <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="py-12 border-t border-border/40 bg-muted/5">
                <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Ultimate SD. Built for Engineers.</p>
                    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        <Link href="/pricing" className="hover:text-foreground transition-colors">
                            Pricing
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Terms
                        </Link>
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
