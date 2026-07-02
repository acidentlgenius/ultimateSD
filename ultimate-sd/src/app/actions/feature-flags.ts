'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  FEATURE_KEYS,
  FEATURE_INTENDED_PLANS,
  type FeatureKey,
  type PlanType,
} from '@/lib/plans';
import type { OverrideMode } from '@/lib/feature-flags';

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  return user.id;
}

function assertKnownFeature(key: string): asserts key is FeatureKey {
  if (!(FEATURE_KEYS as readonly string[]).includes(key)) {
    throw new Error(`Unknown feature: ${key}`);
  }
}

export async function listFeatureFlags() {
  await requireAdmin();
  const [flags, overrides] = await Promise.all([
    prisma.featureFlag.findMany(),
    prisma.featureFlagOverride.findMany({
      include: { user: { select: { email: true } } },
    }),
  ]);
  const flagsByKey = new Map(flags.map((f) => [f.key, f.enabledPlans as PlanType[]]));
  return FEATURE_KEYS.map((key) => ({
    key,
    enabledPlans: flagsByKey.get(key) ?? [],
    intendedPlans: FEATURE_INTENDED_PLANS[key],
    overrides: overrides
      .filter((o) => o.flagKey === key)
      .map((o) => ({
        userId: o.userId,
        email: o.user.email,
        mode: o.mode as OverrideMode,
      })),
  }));
}

export async function setFeatureFlagPlans(key: FeatureKey, enabledPlans: PlanType[]) {
  await requireAdmin();
  assertKnownFeature(key);
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabledPlans },
    create: { key, enabledPlans },
  });
  revalidatePath('/admin');
}

export async function setFeatureFlagOverride(
  key: FeatureKey,
  email: string,
  mode: OverrideMode
) {
  await requireAdmin();
  assertKnownFeature(key);
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!user) {
    throw new Error('User not found');
  }
  await prisma.featureFlagOverride.upsert({
    where: { flagKey_userId: { flagKey: key, userId: user.id } },
    update: { mode },
    create: { flagKey: key, userId: user.id, mode },
  });
  revalidatePath('/admin');
}

export async function removeFeatureFlagOverride(key: FeatureKey, email: string) {
  await requireAdmin();
  assertKnownFeature(key);
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!user) {
    return;
  }
  await prisma.featureFlagOverride.deleteMany({
    where: { flagKey: key, userId: user.id },
  });
  revalidatePath('/admin');
}
