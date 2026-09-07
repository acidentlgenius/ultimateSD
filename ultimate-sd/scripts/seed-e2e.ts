import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

export const E2E_TEST_EMAIL =
  process.env.E2E_TEST_EMAIL ?? 'test@e2e.sysdesignai.local';
export const E2E_TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD ?? 'E2eTestPassword123!';
export const E2E_TEST_USER_NAME = 'E2E Tester';

export const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? 'admin@e2e.sysdesignai.local';
export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? 'E2eAdminPassword123!';
export const E2E_ADMIN_USER_NAME = 'E2E Admin';

const TINYURL_PROBLEM_ID = '1';

export interface SeedE2eOptions {
  tinyUrlCompleted?: boolean;
  resetProgress?: boolean;
}

export async function seedE2eUser(options: SeedE2eOptions = {}) {
  const { tinyUrlCompleted = false, resetProgress = true } = options;
  const passwordHash = await bcrypt.hash(E2E_TEST_PASSWORD, 10);

  let user;
  try {
    user = await prisma.user.upsert({
    where: { email: E2E_TEST_EMAIL },
    create: {
      email: E2E_TEST_EMAIL,
      name: E2E_TEST_USER_NAME,
      password: passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: true,
      planType: 'free',
    },
    update: {
      name: E2E_TEST_USER_NAME,
      password: passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: true,
    },
    });
  } catch (error) {
    console.error('Failed to seed E2E user:', error);
    return null as any;
  }

  if (resetProgress) {
    await prisma.stepSubmission.deleteMany({ where: { userId: user.id } });
    await prisma.practiceSession.deleteMany({ where: { userId: user.id } });
    await prisma.problemProgress.deleteMany({ where: { userId: user.id } });
  }

  if (tinyUrlCompleted) {
    const completedSession = await prisma.practiceSession.create({
      data: {
        userId: user.id,
        problemId: TINYURL_PROBLEM_ID,
        status: 'COMPLETED',
        attemptNumber: 1,
        completedAt: new Date(),
      },
    });

    await prisma.problemProgress.upsert({
      where: {
        userId_problemId: {
          userId: user.id,
          problemId: TINYURL_PROBLEM_ID,
        },
      },
      create: {
        userId: user.id,
        problemId: TINYURL_PROBLEM_ID,
        status: 'COMPLETED',
        progressPercent: 100,
        totalAttempts: 1,
        bestScore: 8,
        lastScore: 8,
      },
      update: {
        status: 'COMPLETED',
        progressPercent: 100,
        bestScore: 8,
        lastScore: 8,
        activeSessionId: null,
      },
    });
  }

  return user;
}

/** Seeds a dedicated admin user for e2e tests that exercise /admin (e.g. feature flags). */
export async function seedE2eAdminUser() {
  const passwordHash = await bcrypt.hash(E2E_ADMIN_PASSWORD, 10);

  try {
    return await prisma.user.upsert({
    where: { email: E2E_ADMIN_EMAIL },
    create: {
      email: E2E_ADMIN_EMAIL,
      name: E2E_ADMIN_USER_NAME,
      password: passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: true,
      planType: 'free',
      role: 'ADMIN',
    },
    update: {
      name: E2E_ADMIN_USER_NAME,
      password: passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: true,
      role: 'ADMIN',
    },
    });
  } catch (error) {
    console.error('Failed to seed E2E admin user:', error);
    return null as any;
  }
}

/**
 * Resets FeatureFlag/FeatureFlagOverride state to a clean dark baseline.
 * A missing FeatureFlag row is interpreted as dark (falls back to
 * FEATURE_SEED_DEFAULTS in feature-flags-server.ts), so deleting rows here
 * is sufficient — no need to recreate them with `enabledPlans: []`.
 */
export async function resetE2eFeatureFlags() {
  try {
    await prisma.featureFlagOverride.deleteMany({});
    await prisma.featureFlag.deleteMany({});
  } catch (error) {
    console.error('Failed to reset feature flags:', error);
  }
}

export async function setFeatureFlagStateForE2e(
  key: string,
  enabledPlans: string[],
) {
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabledPlans },
    create: { key, enabledPlans },
  });
}

async function main() {
  const tinyUrlCompleted = process.argv.includes('--with-progress');
  await seedE2eUser({ tinyUrlCompleted, resetProgress: true });
  await seedE2eAdminUser();
  console.log(`E2E user ready: ${E2E_TEST_EMAIL}`);
  console.log(`E2E admin ready: ${E2E_ADMIN_EMAIL}`);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').includes('seed-e2e');

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error('Failed to seed E2E user:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
