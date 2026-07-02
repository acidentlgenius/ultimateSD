// Uses the shared driver-adapter Prisma client (src/lib/prisma), not a bare
// `new PrismaClient()` — this repo's Prisma 7 setup requires the pg driver
// adapter (see src/lib/prisma.ts), so constructing an unconfigured client
// here would fail at runtime.
import { prisma } from '../../src/lib/prisma';
import { E2E_TEST_EMAIL } from '../constants';

async function findE2eUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: E2E_TEST_EMAIL, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!user) {
    throw new Error('E2E user not seeded — global setup must run first.');
  }
  return user.id;
}

export async function grantFlagToE2eUser(flagKey: string): Promise<void> {
  const userId = await findE2eUserId();
  await prisma.featureFlagOverride.upsert({
    where: { flagKey_userId: { flagKey, userId } },
    update: { mode: 'granted' },
    create: { flagKey, userId, mode: 'granted' },
  });
}

export async function removeFlagOverrideForE2eUser(flagKey: string): Promise<void> {
  const userId = await findE2eUserId();
  await prisma.featureFlagOverride.deleteMany({ where: { flagKey, userId } });
}
