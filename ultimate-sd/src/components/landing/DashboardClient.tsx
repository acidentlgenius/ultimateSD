'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/landing/Hero';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { AdaptiveCoachDemo } from '@/components/landing/AdaptiveCoachDemo';
import { AiInterviewerSection } from '@/components/landing/AiInterviewerSection';
import { RoadmapPreview } from '@/components/landing/RoadmapPreview';
import { UserHero } from '@/components/landing/UserHero';
import { ClaimPlatformAccessBanner } from '@/components/landing/ClaimPlatformAccessBanner';
import type { LaunchOfferPublicStats, LaunchOfferUserState } from '@/lib/launch-offer';

import Link from 'next/link';
import { useState } from 'react';
import { ProblemExplorer } from '@/components/ProblemExplorer';
import { PROBLEMS } from '@/lib/problems';
import { StartHereTrack } from '@/components/landing/StartHereTrack';
import { MostAskedSection } from '@/components/landing/MostAskedSection';
import { useRouter } from 'next/navigation';
import OnboardingModal from '@/components/OnboardingModal';
import { ProblemWithStatus } from '@/types';
import { type PlanType } from '@/lib/plans';

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
    launchStats?: LaunchOfferPublicStats;
    launchUserState?: LaunchOfferUserState | null;
    fresherTrackEnabled?: boolean;
    interviewModeEnabled?: boolean;
}

export function DashboardClient({
    user,
    recommendations,
    onboardingCompleted = false,
    launchStats,
    launchUserState = null,
    fresherTrackEnabled = false,
    interviewModeEnabled = false,
}: DashboardClientProps) {
    const [showOnboarding, setShowOnboarding] = useState(!!(user && !onboardingCompleted));
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {user && (
                <OnboardingModal
                    isOpen={showOnboarding}
                    onClose={() => setShowOnboarding(false)}
                    userId={user.id!}
                />
            )}

            {user ? (
                <>
                    <UserHero
                        user={user}
                        recommendations={recommendations}
                        setShowOnboarding={setShowOnboarding}
                    />
                    {launchStats && (
                        <ClaimPlatformAccessBanner
                            launchStats={launchStats}
                            launchUserState={launchUserState}
                            planType={user.planType ?? 'free'}
                        />
                    )}
                </>
            ) : (
                <Hero
                    launchStats={launchStats?.isActive ? launchStats : undefined}
                    showFresherPath={fresherTrackEnabled}
                />
            )}

            {!user && <StartHereTrack problems={recommendations?.recommended ?? []} />}
            {!user && (
                <MostAskedSection
                    selectedCollectionId={null}
                    onSelectCollection={(id) => {
                        if (id) router.push(`/problems?collection=${id}`);
                    }}
                />
            )}
            {!user && <FeatureShowcase />}
            {!user && <AdaptiveCoachDemo />}
            {!user && <AiInterviewerSection interviewModeEnabled={interviewModeEnabled} />}
            {!user && (
                <ProblemExplorer
                    problems={PROBLEMS}
                    showHeading={false}
                    companyCollection={null}
                    setCompanyCollection={(id) => {
                        if (id) router.push(`/problems?collection=${id}`);
                    }}
                />
            )}

            <RoadmapPreview />

            {!user && (
                <div className="container mx-auto px-4 pb-24 relative z-10 max-w-7xl">
                    <div className="rounded-[3rem] relative overflow-hidden bg-gradient-to-br from-primary to-purple-700 px-6 py-24 text-center shadow-2xl shadow-primary/30">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-black/10 dark:bg-white/10 blur-[120px] rounded-full pointer-events-none" />

                        <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Ready to Design?</h2>
                            <p className="text-white/80 text-xl font-light leading-relaxed">
                                Your journey to mastering distributed systems starts with a single component. Browse the problem set or launch the free canvas.
                            </p>
                            <div className="pt-6 flex flex-wrap justify-center gap-4">
                                <Link href="/problems">
                                    <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20 border-0 h-16 px-10 font-bold text-lg rounded-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
                                        Browse problems <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/draw">
                                    <Button size="lg" variant="outline" className="h-16 px-10 font-bold text-lg rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                                        Launch Canvas
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="py-12 border-t border-border/40 bg-muted/5">
                <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Ultimate SD. Built for Engineers.</p>
                    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        <Link href="/problems" className="hover:text-foreground transition-colors">
                            Problems
                        </Link>
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
