import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/landing/DashboardClient";
import { getUserRecommendations } from "@/app/actions/recommendations";
import { SystemDesignProblem, ProblemWithStatus } from "@/types";

export default async function Home() {
  const session = await auth();

  // ...

  let recommendations: {
    dailyPick: ProblemWithStatus | null;
    needsReview: ProblemWithStatus[];
    recommended: ProblemWithStatus[];
  } = { dailyPick: null, needsReview: [], recommended: [] };
  let onboardingCompleted = false;

  if (session?.user?.id) {
    const [recs, user] = await Promise.all([
      getUserRecommendations(),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingCompleted: true }
      })
    ]);
    recommendations = recs;
    onboardingCompleted = !!user?.onboardingCompleted;
  }

  return (
    <DashboardClient
      user={session?.user}
      recommendations={recommendations}
      onboardingCompleted={onboardingCompleted}
    />
  );
}
