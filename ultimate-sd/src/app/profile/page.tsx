import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsOverview } from "@/components/profile/StatsOverview";
import { HistoryList, HistoryItemData } from "@/components/profile/HistoryList";
import { PROBLEMS } from "@/lib/problems";

export const metadata = {
    title: "User Profile | Ultimate SD",
    description: "Your system design practice progress and history.",
};

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    // Fetch full user data including stats
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        redirect("/login");
    }

    // Fetch problem progress history
    // Ordered by lastAttemptAt descending, limit 50
    const progressHistory = await prisma.problemProgress.findMany({
        where: {
            userId: user.id,
            // Only show items that have at least started
            status: { not: "NOT_STARTED" },
        },
        orderBy: {
            lastAttemptAt: "desc",
        },
        take: 50,
    });

    // Calculate stats if they aren't fully tracked on user model yet
    // (Though schema has them, we can double check or rely on schema)
    const completedCount = progressHistory.filter(p => p.status === 'COMPLETED').length;

    // Calculate average score
    const itemsWithScore = progressHistory.filter(p => p.lastScore !== null);
    const avgScore = itemsWithScore.length > 0
        ? itemsWithScore.reduce((acc, curr) => acc + (curr.lastScore || 0), 0) / itemsWithScore.length
        : null;

    // Transform to HistoryItemData
    const historyItems: HistoryItemData[] = progressHistory.map((item) => {
        // Find problem title from static data
        const problem = PROBLEMS.find(p => p.id === item.problemId);

        return {
            id: item.id,
            problemId: item.problemId,
            problemTitle: problem?.title || `Problem ${item.problemId}`,
            status: item.status,
            score: item.lastScore,
            lastAttemptAt: item.lastAttemptAt,
        };
    });

    const stats = {
        totalSolved: user.completedProblems || completedCount,
        activeDays: user.streak,
        avgScore: avgScore,
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <ProfileHeader user={user} />
            <StatsOverview stats={stats} />
            <HistoryList history={historyItems} />
        </div>
    );
}
