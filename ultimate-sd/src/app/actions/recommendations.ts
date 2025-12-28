'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { SystemDesignProblem } from '@/types';

export async function getUserRecommendations() {
    const session = await auth();
    if (!session?.user?.id) {
        return { dailyPick: null, needsReview: [], recommended: [] };
    }

    const userId = session.user.id;

    // 1. Fetch User Profile & Progress
    interface UserPreferences {
        targetCompanies: string[] | null;
        preferredDifficulty: string[] | null;
        focusAreas: string[] | null;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { targetCompanies: true, preferredDifficulty: true, focusAreas: true }
    }) as UserPreferences | null;

    if (!user) return { dailyPick: null, needsReview: [], recommended: [] };

    // Ensure arrays are not null
    const targetCompanies = user.targetCompanies || [];
    const preferredDifficulty = user.preferredDifficulty || [];
    const focusAreas = user.focusAreas || [];

    const progress = await prisma.problemProgress.findMany({
        where: { userId }
    });

    const progressMap = new Map(progress.map(p => [p.problemId, p]));

    // 2. Score Problems
    const scoredProblems = PROBLEMS.map(problem => {
        let score = 0;
        if (!problem.id) return { problem, score: -1 };

        const pStatus = progressMap.get(problem.id);

        // Filter out completed unless review needed
        if (pStatus?.status === 'COMPLETED' && (!pStatus.nextRepetitionDate || pStatus.nextRepetitionDate > new Date())) {
            return { problem, score: -100 }; // Deprioritize completed
        }

        // A. SRS Urgency (Highest Priority)
        if (pStatus?.nextRepetitionDate && pStatus.nextRepetitionDate <= new Date()) {
            score += 500; // Immediate review needed
        }

        // B. Weakness / Status Boost
        if (pStatus?.status === 'REVIEW_NEEDED') score += 200;
        if (pStatus?.status === 'IN_PROGRESS') score += 100; // Finish what you started

        // C. Company Match
        if (problem.companies?.length > 0 && targetCompanies.length > 0 && 
            targetCompanies.some((c: string) => problem.companies.includes(c))) {
            score += 150;
        }

        // D. Difficulty Match
        if (problem.difficulty && preferredDifficulty.length > 0 && 
            preferredDifficulty.includes(problem.difficulty)) {
            score += 50;
        }

        // E. Focus Area Match (Category)
        if (problem.category && focusAreas.length > 0 && 
            focusAreas.includes(problem.category)) {
            score += 80;
        }

        // F. Novelty (Slight boost for untouched problems if no high urgency items)
        if (!pStatus) {
            score += 10;
        }

        return { problem, score, status: pStatus?.status };
    });

    // 3. Sort & Categorize
    scoredProblems.sort((a, b) => b.score - a.score);

    const validProblems = scoredProblems.filter(p => p.score > -50);

    const dailyPick = validProblems.length > 0 ? validProblems[0] : null;

    // Review Bucket: High score + existing progress
    const needsReview = validProblems.filter(p => p.score > 200 && p.status && p.status !== 'NOT_STARTED').slice(0, 3);

    // General Recommendations: The rest
    const recommended = validProblems.filter(p => p !== dailyPick && !needsReview.includes(p)).slice(0, 5);

    return {
        dailyPick: dailyPick?.problem ?? null,
        needsReview: needsReview.map(p => p.problem),
        recommended: recommended.map(p => p.problem)
    };
}
