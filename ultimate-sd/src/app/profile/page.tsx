import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsOverview } from "@/components/profile/StatsOverview";
import { HistoryList, HistoryItemData } from "@/components/profile/HistoryList";
import { PROBLEMS } from "@/lib/problems";
import type { ProgressStatus } from "@/types";

export const metadata = {
    title: "User Profile | Ultimate SD",
    description: "Your system design practice progress and history.",
};

function computeDurationMinutes(
    startedAt: Date,
    completedAt: Date | null,
    totalPausedSeconds: number
): number {
    const end = completedAt ?? new Date();
    const elapsedSeconds = (end.getTime() - startedAt.getTime()) / 1000;
    const effectiveSeconds = Math.max(0, elapsedSeconds - totalPausedSeconds);
    return Math.round(effectiveSeconds / 60);
}

function deriveSessionDisplayStatus(
    sessionStatus: string,
    progressStatus: ProgressStatus | undefined
): ProgressStatus {
    if (sessionStatus === "COMPLETED") {
        if (progressStatus === "REVIEW_NEEDED") return "REVIEW_NEEDED";
        return "COMPLETED";
    }
    if (sessionStatus === "ACTIVE") return "IN_PROGRESS";
    return progressStatus ?? "IN_PROGRESS";
}

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        redirect("/login");
    }

    const [sessions, progressRows] = await Promise.all([
        prisma.practiceSession.findMany({
            where: { userId: user.id },
            orderBy: { startedAt: "desc" },
            take: 50,
            include: {
                submissions: {
                    select: { stepId: true, isPassing: true },
                },
            },
        }),
        prisma.problemProgress.findMany({
            where: {
                userId: user.id,
                status: { not: "NOT_STARTED" },
            },
        }),
    ]);

    const progressByProblem = new Map(progressRows.map((p) => [p.problemId, p]));

    const completedCount = progressRows.filter((p) => p.status === "COMPLETED").length;
    const itemsWithScore = progressRows.filter((p) => p.lastScore !== null);
    const avgScore =
        itemsWithScore.length > 0
            ? itemsWithScore.reduce((acc, curr) => acc + (curr.lastScore ?? 0), 0) /
              itemsWithScore.length
            : null;

    const historyItems: HistoryItemData[] = sessions.map((item) => {
        const problem = PROBLEMS.find((p) => p.id === item.problemId);
        const progress = progressByProblem.get(item.problemId);
        const passingStepIds = new Set(
            item.submissions.filter((s) => s.isPassing).map((s) => s.stepId)
        );

        return {
            id: item.id,
            sessionId: item.id,
            problemId: item.problemId,
            problemSlug: problem?.slug ?? item.problemId,
            problemTitle: problem?.title ?? `Problem ${item.problemId}`,
            status: deriveSessionDisplayStatus(item.status, progress?.status),
            score: item.finalScore ?? progress?.lastScore ?? null,
            lastAttemptAt: item.completedAt ?? item.startedAt,
            attemptNumber: item.attemptNumber,
            stepsCompleted: passingStepIds.size,
            durationMinutes: computeDurationMinutes(
                item.startedAt,
                item.completedAt,
                item.totalPausedSeconds
            ),
        };
    });

    const stats = {
        totalSolved: user.completedProblems || completedCount,
        activeDays: user.streak,
        avgScore,
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <ProfileHeader user={user} />
            <StatsOverview stats={stats} />
            <HistoryList history={historyItems} />
        </div>
    );
}
