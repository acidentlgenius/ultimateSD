import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsOverview } from "@/components/profile/StatsOverview";
import { HistoryList, HistoryItemData } from "@/components/profile/HistoryList";
import { PROBLEMS } from "@/lib/problems";
import { deriveDisplayStatus } from "@/lib/progress-utils";
import { SessionStatus } from "@prisma/client";

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

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findFirst({
        where: { email: { equals: session.user.email, mode: 'insensitive' } },
    });

    if (!user) {
        redirect("/login");
    }

    const [progressRows, sessionsByProblemRows, latestCompletedSessions] = await Promise.all([
        prisma.problemProgress.findMany({
            where: {
                userId: user.id,
                status: { not: "NOT_STARTED" },
            },
            orderBy: { lastAttemptAt: "desc" },
            take: 50,
            include: {
                activeSession: true,
            },
        }),
        prisma.practiceSession.findMany({
            where: { userId: user.id },
            select: { problemId: true, status: true },
        }),
        prisma.practiceSession.findMany({
            where: {
                userId: user.id,
                status: SessionStatus.COMPLETED,
            },
            orderBy: { completedAt: "desc" },
            select: {
                id: true,
                problemId: true,
                finalScore: true,
                startedAt: true,
                completedAt: true,
                totalPausedSeconds: true,
            },
        }),
    ]);

    const sessionsByProblem = new Map<string, { status: SessionStatus }[]>();
    for (const row of sessionsByProblemRows) {
        const list = sessionsByProblem.get(row.problemId) ?? [];
        list.push({ status: row.status });
        sessionsByProblem.set(row.problemId, list);
    }

    const latestCompletedByProblem = new Map<
        string,
        (typeof latestCompletedSessions)[number]
    >();
    for (const completedSession of latestCompletedSessions) {
        if (!latestCompletedByProblem.has(completedSession.problemId)) {
            latestCompletedByProblem.set(completedSession.problemId, completedSession);
        }
    }

    const completedCount = progressRows.filter((p) => p.status === "COMPLETED").length;
    const itemsWithScore = progressRows.filter((p) => p.lastScore !== null);
    const avgScore =
        itemsWithScore.length > 0
            ? itemsWithScore.reduce((acc, curr) => acc + (curr.lastScore ?? 0), 0) /
              itemsWithScore.length
            : null;

    const historyItems: HistoryItemData[] = progressRows.map((progress) => {
        const problem = PROBLEMS.find((p) => p.id === progress.problemId);
        const sessions = sessionsByProblem.get(progress.problemId) ?? [];
        const status = deriveDisplayStatus({
            sessions: sessions.map((s) => ({ status: s.status })),
            summaryStatus: progress.status,
            nextRepetitionDate: progress.nextRepetitionDate,
        });

        const latestCompleted = latestCompletedByProblem.get(progress.problemId);
        const activeSession = progress.activeSession;
        const timingSession =
            activeSession?.status === SessionStatus.ACTIVE
                ? activeSession
                : latestCompleted ?? activeSession;

        return {
            id: progress.id,
            sessionId:
                status === "COMPLETED" || status === "REVIEW_NEEDED"
                    ? latestCompleted?.id
                    : undefined,
            problemId: progress.problemId,
            problemSlug: problem?.slug ?? progress.problemId,
            problemTitle: problem?.title ?? `Problem ${progress.problemId}`,
            status,
            score: progress.bestScore ?? progress.lastScore ?? latestCompleted?.finalScore ?? null,
            lastAttemptAt: progress.lastAttemptAt,
            attemptNumber: progress.totalAttempts,
            stepsCompleted: progress.completedStepIds.length,
            durationMinutes: timingSession
                ? computeDurationMinutes(
                      timingSession.startedAt,
                      timingSession.completedAt ?? null,
                      timingSession.totalPausedSeconds
                  )
                : undefined,
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
