import { auth } from '@/auth';
import { PricingClient } from '@/app/pricing/PricingClient';
import { getRazorpayKeyId } from '@/lib/razorpay';
import { FREE_PROBLEM_SLUGS, type PlanType } from '@/lib/plans';
import {
  getLaunchOfferStats,
  getLaunchOfferUserState,
} from '@/app/actions/launch-offer';
import { LaunchOfferSection } from '@/components/landing/LaunchOfferSection';

export default async function PricingPage() {
  const session = await auth();
  const currentPlan: PlanType = session?.user?.planType ?? 'free';

  const [launchStats, launchUserState] = await Promise.all([
    getLaunchOfferStats(),
    session?.user?.id
      ? getLaunchOfferUserState(session.user.id)
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with {FREE_PROBLEM_SLUGS.length} core problems for free. Upgrade to unlock the full library and AI-powered feedback.
          </p>
          {session?.user?.hasActivePlan && session.user.planExpiresAt && (
            <p className="text-sm text-muted-foreground">
              Your {session.user.planType} plan is active until{' '}
              {new Date(session.user.planExpiresAt).toLocaleDateString()}.
              {session.user.hasAiPlan && ` · ${session.user.aiCredits} AI credits remaining`}
            </p>
          )}
          {session?.user && !session.user.hasActivePlan && (
            <p className="text-sm text-muted-foreground">
              {session.user.aiCredits} free AI credits remaining this month
            </p>
          )}
        </div>

        {launchStats.isActive && (
          <div className="mb-12">
            <LaunchOfferSection
              stats={launchStats}
              userState={launchUserState}
              isLoggedIn={Boolean(session?.user)}
            />
          </div>
        )}

        <PricingClient
          isLoggedIn={Boolean(session?.user)}
          currentPlan={currentPlan}
          razorpayKeyId={getRazorpayKeyId()}
          launchStats={launchStats}
          launchUserState={launchUserState}
        />
      </div>
    </div>
  );
}
