import { prisma } from '@/lib/prisma';
import { FEATURE_SEED_DEFAULTS, FEATURE_KEYS, type FeatureKey, type PlanType } from '@/lib/plans';
import { getEffectivePlanType } from '@/lib/access';
import { resolveFeatureAccess, type OverrideMode } from '@/lib/feature-flags';

export async function getFeatureFlagState(feature: FeatureKey): Promise<PlanType[]> {
  let row: any = null;
  try {
    row = await prisma.featureFlag.findUnique({ where: { key: feature } });
  } catch (error) {
    console.warn(`Failed to fetch feature flag ${feature} (db unreachable?)`, error);
  }
  if (!row) {
    return FEATURE_SEED_DEFAULTS[feature];
  }
  return row.enabledPlans as PlanType[];
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
  let flags: { key: string; enabledPlans: string[] }[] = [];
  let overrides: { flagKey: string; mode: string }[] = [];
  let user: { planType: string; planExpiresAt: Date | null } | null = null;

  try {
    [flags, overrides, user] = await Promise.all([
      prisma.featureFlag.findMany() as any,
      userId
        ? prisma.featureFlagOverride.findMany({ where: { userId } }) as any
        : Promise.resolve([]),
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { planType: true, planExpiresAt: true },
          }) as any
        : Promise.resolve(null),
    ]);
  } catch (error) {
    console.warn('Failed to fetch feature flags in batch (db unreachable?)', error);
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
