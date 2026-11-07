import { prisma } from '@/lib/prisma';
import { FEATURE_SEED_DEFAULTS, FEATURE_KEYS, type FeatureKey, type PlanType } from '@/lib/plans';
import { getEffectivePlanType } from '@/lib/access';
import { resolveFeatureAccess, type OverrideMode } from '@/lib/feature-flags';

export async function getFeatureFlagState(feature: FeatureKey): Promise<PlanType[]> {
  try {
    const row = await prisma.featureFlag.findUnique({ where: { key: feature } });
    if (!row) {
      return FEATURE_SEED_DEFAULTS[feature];
    }
    return row.enabledPlans as PlanType[];
  } catch (error) {
    return FEATURE_SEED_DEFAULTS[feature];
  }
}

export async function canAccessFeature(
  userId: string | null,
  feature: FeatureKey
): Promise<boolean> {
  const enabledPlans = await getFeatureFlagState(feature);

  if (!userId) {
    return resolveFeatureAccess({ override: null, enabledPlans, plan: 'free' });
  }

  const [override, user] = await Promise.all([
    prisma.featureFlagOverride.findUnique({
      where: { flagKey_userId: { flagKey: feature, userId } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true, planExpiresAt: true },
    }),
  ]);

  const plan = user
    ? getEffectivePlanType({ planType: user.planType as PlanType, planExpiresAt: user.planExpiresAt })
    : 'free';
  return resolveFeatureAccess({
    override: (override?.mode as OverrideMode | undefined) ?? null,
    enabledPlans,
    plan,
  });
}

export async function getAccessibleFeatures(
  userId: string | null
): Promise<Record<FeatureKey, boolean>> {
  let flags: any[] = [];
  let overrides: any[] = [];
  let user = null;
  try {
    const results = await Promise.all([
    prisma.featureFlag.findMany(),
    userId
      ? prisma.featureFlagOverride.findMany({ where: { userId } })
      : Promise.resolve([]),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { planType: true, planExpiresAt: true },
        })
      : Promise.resolve(null),
    ]);
    flags = results[0];
    overrides = results[1];
    user = results[2];
  } catch (e) {
    console.warn("Could not fetch feature flags");
  }

  const plan = user
    ? getEffectivePlanType({ planType: user.planType as PlanType, planExpiresAt: user.planExpiresAt })
    : 'free';
  const flagsByKey = new Map(flags.map((f) => [f.key, f.enabledPlans as PlanType[]]));
  const overridesByKey = new Map(overrides.map((o) => [o.flagKey, o.mode as OverrideMode]));

  const result = {} as Record<FeatureKey, boolean>;
  for (const key of FEATURE_KEYS) {
    result[key] = resolveFeatureAccess({
      override: overridesByKey.get(key) ?? null,
      enabledPlans: flagsByKey.get(key) ?? FEATURE_SEED_DEFAULTS[key],
      plan,
    });
  }
  return result;
}
