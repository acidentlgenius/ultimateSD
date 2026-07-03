import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/landing/DashboardClient";
import { getUserRecommendations } from "@/app/actions/recommendations";
import { getUserProgressMap } from "@/app/actions/progress";
import {
  getLaunchOfferStats,
  getLaunchOfferUserState,
} from "@/app/actions/launch-offer";
import { canAccessFeature } from "@/lib/feature-flags-server";
import { PROBLEMS } from "@/lib/problems";
import { ProblemWithStatus } from "@/types";

export default async function Home() {
  const session = await auth();

  const [launchStats, launchUserState, fresherTrackEnabled, interviewModeEnabled] = await Promise.all([
    getLaunchOfferStats(),
    session?.user?.id
      ? getLaunchOfferUserState(session.user.id)
      : Promise.resolve(null),
    canAccessFeature(session?.user?.id ?? null, 'fresherTrack'),
    canAccessFeature(session?.user?.id ?? null, 'interviewMode'),
  ]);

  // ...

  let recommendations: {
    dailyPick: ProblemWithStatus | null;
    needsReview: ProblemWithStatus[];
    recommended: ProblemWithStatus[];
  } = { dailyPick: null, needsReview: [], recommended: [] };
  let onboardingCompleted = false;
  let problemsWithStatus: ProblemWithStatus[] = PROBLEMS;

  if (session?.user?.id) {
    const [recs, user, progressMap] = await Promise.all([
      getUserRecommendations(),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingCompleted: true }
      }),
      getUserProgressMap(),
    ]);
    recommendations = recs;
    onboardingCompleted = !!user?.onboardingCompleted;
    problemsWithStatus = PROBLEMS.map((p) => ({
      ...p,
      ...(progressMap.get(p.id) ?? {}),
    }));
  }

  return (
    <DashboardClient
      user={session?.user}
      recommendations={recommendations}
      onboardingCompleted={onboardingCompleted}
      problems={problemsWithStatus}
      launchStats={launchStats}
      launchUserState={launchUserState}
      fresherTrackEnabled={fresherTrackEnabled}
      interviewModeEnabled={interviewModeEnabled}
    />
  );
}
