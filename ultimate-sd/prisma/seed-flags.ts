// Uses the shared driver-adapter Prisma client (src/lib/prisma), not a bare
// `new PrismaClient()` — this repo's Prisma 7 setup requires the pg driver
// adapter (see src/lib/prisma.ts), so constructing an unconfigured client
// here would fail at runtime.
import { prisma } from '../src/lib/prisma';
import { FEATURE_KEYS, FEATURE_SEED_DEFAULTS } from '../src/lib/plans';

async function main() {
  for (const key of FEATURE_KEYS) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: {}, // never clobber a live launch
      create: { key, enabledPlans: FEATURE_SEED_DEFAULTS[key] },
    });
  }
  console.log('Seeded feature flags (existing rows untouched).');
}

main().finally(() => prisma.$disconnect());
