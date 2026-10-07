import { Button } from '@/components/ui/button';
import { pickSecondaryRecommendation } from '@/lib/recommendations-logic';
import { ProblemWithStatus } from '@/types';
import ProblemCard from '@/components/ProblemCard';
import { Sparkles } from 'lucide-react';
import { SessionDashboard } from './SessionDashboard';

interface UserHeroProps {
    user: {
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
    setShowOnboarding: (show: boolean) => void;
}

export function UserHero({ user, recommendations, setShowOnboarding }: UserHeroProps) {
    const secondaryRec = recommendations
        ? pickSecondaryRecommendation(
            recommendations.dailyPick,
            recommendations.needsReview,
            recommendations.recommended
        )
        : null;

    return (
        <div className="container mx-auto px-4 py-12 animate-slide-up">
            <div className="glass-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden group hover:shadow-glow-sm transition-all duration-500 border-black/10 dark:border-white/10">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                    <Sparkles className="h-3 w-3" /> Dashboard
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
                                Welcome back, <span className="text-gradient font-extrabold">{user.name?.split(' ')[0] || 'Engineer'}</span>!
                            </h1>
                            <p className="text-muted-foreground text-lg md:text-xl font-light">
                                You're on a roll. Let's keep that <span className="text-amber-500 font-bold drop-shadow-sm">{user.streak} day streak</span> alive.
                            </p>
                        </div>
                        <div className="flex gap-4 self-stretch md:self-auto">
                            <div className="flex-1 md:flex-none text-center p-6 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-black/10 dark:border-white/10 shadow-sm transition-transform hover:scale-105 hover:bg-black/10 dark:bg-white/10 group/stat">
                                <div className="text-3xl font-bold text-blue-500 group-hover/stat:scale-110 transition-transform">{user.xp}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Total XP</div>
                            </div>
                            <div className="flex-1 md:flex-none text-center p-6 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-black/10 dark:border-white/10 shadow-sm transition-transform hover:scale-105 hover:bg-black/10 dark:bg-white/10 group/stat">
                                <div className="text-3xl font-bold text-purple-500 group-hover/stat:scale-110 transition-transform">{user.level}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Level</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Recommended for you
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Daily Pick */}
                            {recommendations?.dailyPick && (
                                <div className="h-full transform transition-all hover:scale-[1.01] hover:-translate-y-1 duration-300">
                                    <ProblemCard problem={recommendations.dailyPick} featured badge="Daily Top Pick" />
                                </div>
                            )}

                            {secondaryRec &&
                                secondaryRec.problem.slug !== recommendations?.dailyPick?.slug && (
                                <div className="h-full transform transition-all hover:scale-[1.01] hover:-translate-y-1 duration-300">
                                    <ProblemCard
                                        problem={secondaryRec.problem}
                                        badge={secondaryRec.isReview ? 'Review Due' : 'Recommended'}
                                    />
                                </div>
                            )}

                            {(!recommendations?.dailyPick && !recommendations?.recommended?.length) && (
                                <div className="col-span-2 p-12 text-center text-muted-foreground bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center">
                                    <p className="mb-6 text-lg">No recommendations yet — refresh your preferences and we&apos;ll pick problems for you.</p>
                                    <Button variant="outline" size="lg" onClick={() => setShowOnboarding(true)} className="rounded-full px-8 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                                        Set Preferences
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Offline Sessions */}
                    <SessionDashboard />
                </div>
            </div>
        </div>
    );
}
