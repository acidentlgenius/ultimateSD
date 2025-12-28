
console.log('Running Streak Calculation Tests (JS Only)...');

function calculateStreak(currentStreak, lastPracticeAt, now) {
    if (!lastPracticeAt) {
        return 1;
    }

    // Ensure dates are date objects
    now = new Date(now);
    lastPracticeAt = new Date(lastPracticeAt);

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

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

const tests = [
    {
        name: 'First practice ever',
        currentStreak: 0,
        lastPracticeAt: null,
        expected: 1
    },
    {
        name: 'Practiced yesterday',
        currentStreak: 5,
        lastPracticeAt: yesterday,
        expected: 6
    },
    {
        name: 'Practiced today already',
        currentStreak: 5,
        lastPracticeAt: today,
        expected: 5
    },
    {
        name: 'Missed a day (2 days ago)',
        currentStreak: 10,
        lastPracticeAt: twoDaysAgo,
        expected: 1
    }
];

let passed = 0;
tests.forEach(test => {
    const result = calculateStreak(test.currentStreak, test.lastPracticeAt, today);
    if (result === test.expected) {
        console.log(`✅ [PASS] ${test.name}`);
        passed++;
    } else {
        console.error(`❌ [FAIL] ${test.name}: Expected ${test.expected}, got ${result}`);
    }
});

if (passed === tests.length) {
    console.log('All tests passed.');
    process.exit(0);
} else {
    process.exit(1);
}
