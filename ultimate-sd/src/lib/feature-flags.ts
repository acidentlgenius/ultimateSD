import type { PlanType } from '@/lib/plans';

export type OverrideMode = 'granted' | 'denied';

export interface FeatureAccessInput {
  override: OverrideMode | null;
  enabledPlans: PlanType[];
  plan: PlanType;
}

/** The single flag-access rule: user override → plan-level launch. */
export function resolveFeatureAccess({ override, enabledPlans, plan }: FeatureAccessInput): boolean {
  if (override === 'granted') {
    return true;
  }
  if (override === 'denied') {
    return false;
  }
  return enabledPlans.includes(plan);
}
