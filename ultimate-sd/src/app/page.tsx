import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/landing/DashboardClient";
import { getUserRecommendations } from "@/app/actions/recommendations";
import {
  getLaunchOfferStats,
  getLaunchOfferUserState,
} from "@/app/actions/launch-offer";
import { canAccessFeature } from "@/lib/feature-flags-server";
import { resolveSessionUserId } from "@/lib/session-user";
import { ProblemWithStatus } from "@/types";

export default async function Home() {
  const session = await auth();
  const resolvedUserId = session?.user
    ? await resolveSessionUserId(session.user)
    : null;

  const [launchStats, launchUserState, fresherTrackEnabled, interviewModeEnabled] = await Promise.all([
    getLaunchOfferStats(),
    resolvedUserId
      ? getLaunchOfferUserState(resolvedUserId)
      : Promise.resolve(null),
    canAccessFeature(resolvedUserId, 'fresherTrack'),
    canAccessFeature(resolvedUserId, 'interviewMode'),
  ]);

  let recommendations: {
    dailyPick: ProblemWithStatus | null;
    needsReview: ProblemWithStatus[];
    recommended: ProblemWithStatus[];
  } = { dailyPick: null, needsReview: [], recommended: [] };
  let onboardingCompleted = false;

  if (resolvedUserId) {
    try {
      const [recs, user] = await Promise.all([
        getUserRecommendations(),
        prisma.user.findUnique({
          where: { id: resolvedUserId },
          select: { onboardingCompleted: true }
        }),
      ]);
      recommendations = recs;
      onboardingCompleted = !!user?.onboardingCompleted;
    } catch (e) {
      console.error('Failed to fetch user data for dashboard', e);
    }
  }

  return (
    <DashboardClient
      user={session?.user}
      recommendations={recommendations}
      onboardingCompleted={onboardingCompleted}
      launchStats={launchStats}
      launchUserState={launchUserState}
      fresherTrackEnabled={fresherTrackEnabled}
      interviewModeEnabled={interviewModeEnabled}
    />
  );
}
