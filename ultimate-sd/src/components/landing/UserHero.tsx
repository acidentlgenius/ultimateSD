import { Button } from '@/components/ui/button';
import { ProblemWithStatus } from '@/types';
import ProblemCard from '@/components/ProblemCard';
import OnboardingModal from '@/components/OnboardingModal';
import { useState } from 'react';

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
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="glass rounded-3xl p-8 border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-50" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-3 tracking-tight">
                                Welcome back, <span className="gradient-text-primary">{user.name?.split(' ')[0] || 'Engineer'}</span>! 🚀
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                You're on a roll. Let's keep that <span className="text-amber-500 font-bold">{user.streak} day streak</span> alive.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center p-5 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm transition-transform hover:scale-105">
                                <div className="text-3xl font-bold text-blue-500">{user.xp}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">Total XP</div>
                            </div>
                            <div className="text-center p-5 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm transition-transform hover:scale-105">
                                <div className="text-3xl font-bold text-purple-500">{user.level}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">Level</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-border/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recommended for you</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Daily Pick */}
                            {recommendations?.dailyPick && (
                                <div className="h-full transform transition-all hover:scale-[1.01]">
                                    <ProblemCard problem={recommendations.dailyPick} featured badge="Daily Top Pick" />
                                </div>
                            )}

                            {/* Review Needed or Next Rec */}
                            {(recommendations?.needsReview?.[0] || recommendations?.recommended?.[0]) && (
                                (() => {
                                    const rec = recommendations?.needsReview?.[0] || recommendations?.recommended?.[0];
                                    const isReview = !!recommendations?.needsReview?.[0];
                                    return (
                                        <div className="h-full transform transition-all hover:scale-[1.01]">
                                            <ProblemCard
                                                problem={rec}
                                                badge={isReview ? "Review Due" : "Recommended"}
                                            />
                                        </div>
                                    )
                                })()
                            )}

                            {(!recommendations?.dailyPick && !recommendations?.recommended?.length) && (
                                <div className="col-span-2 p-8 text-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                                    <p className="mb-4">Complete your profile to get personalized recommendations!</p>
                                    <Button variant="outline" onClick={() => setShowOnboarding(true)}>
                                        Set Preferences
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
