
export function calculateStreak(
    currentStreak: number,
    lastPracticeAt: Date | null,
    now: Date = new Date()
): number {
    if (!lastPracticeAt) {
        return 1;
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(
        lastPracticeAt.getFullYear(),
        lastPracticeAt.getMonth(),
        lastPracticeAt.getDate()
    );

    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Already practiced today
        return currentStreak > 0 ? currentStreak : 1;
    } else if (diffDays === 1) {
        // Practiced yesterday
        return currentStreak + 1;
    } else {
        // Missed a day or more
        return 1;
    }
}

export function calculateLevel(xp: number): number {
    // Level = floor(sqrt(XP / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}
