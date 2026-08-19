import { prisma } from '@/lib/prisma';
import { FEATURE_SEED_DEFAULTS, FEATURE_KEYS, type FeatureKey, type PlanType } from '@/lib/plans';
import { getEffectivePlanType } from '@/lib/access';
import { resolveFeatureAccess, type OverrideMode } from '@/lib/feature-flags';

// In-memory cache for feature flags to reduce DB load
const flagCache = new Map<FeatureKey, { data: PlanType[], timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// Periodic cleanup to prevent memory leaks
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of flagCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      flagCache.delete(key);
    }
  }
}, CACHE_TTL_MS);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export function _resetFeatureFlagCacheForTesting() {
  flagCache.clear();
}

export async function getFeatureFlagState(feature: FeatureKey): Promise<PlanType[]> {
  const cached = flagCache.get(feature);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const row = await prisma.featureFlag.findUnique({ where: { key: feature } });
  if (!row) {
    const defaults = FEATURE_SEED_DEFAULTS[feature];
    flagCache.set(feature, { data: defaults, timestamp: Date.now() });
    return defaults;
  }
  const plans = row.enabledPlans as PlanType[];
  flagCache.set(feature, { data: plans, timestamp: Date.now() });
  return plans;
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
  // Always query flags fresh here because `getAccessibleFeatures` is used
  // to populate a broad payload of all flags at once. The caching layer in
  // `getFeatureFlagState` only caches individual flags accessed during requests.
  const [flags, overrides, user] = await Promise.all([
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
