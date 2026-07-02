'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  listFeatureFlags,
  setFeatureFlagPlans,
  setFeatureFlagOverride,
  removeFeatureFlagOverride,
} from '@/app/actions/feature-flags';
import type { FeatureKey, PlanType } from '@/lib/plans';

const ALL_PLANS: { value: PlanType; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'platform', label: 'Platform' },
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'ai', label: 'AI Pro' },
];

type FlagRow = Awaited<ReturnType<typeof listFeatureFlags>>[number];

export function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    listFeatureFlags()
      .then(setFlags)
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlan = (flag: FlagRow, plan: PlanType) => {
    const next = flag.enabledPlans.includes(plan)
      ? flag.enabledPlans.filter((p) => p !== plan)
      : [...flag.enabledPlans, plan];
    const deviates = next.some((p) => !flag.intendedPlans.includes(p));
    if (
      deviates &&
      !confirm(
        `"${flag.key}" is intended for: ${flag.intendedPlans.join(', ') || 'none'}. Enable for ${next.join(', ') || 'none'} anyway?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await setFeatureFlagPlans(flag.key, next);
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const applyOverride = (key: FeatureKey, mode: 'granted' | 'denied') => {
    const email = emailInputs[key]?.trim();
    if (!email) return;
    startTransition(async () => {
      try {
        await setFeatureFlagOverride(key, email, mode);
        setEmailInputs((s) => ({ ...s, [key]: '' }));
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const removeOverride = (key: FeatureKey, email: string) => {
    startTransition(async () => {
      try {
        await removeFeatureFlagOverride(key, email);
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {flags.map((flag) => (
          <div key={flag.key} className="rounded-lg border bg-white dark:bg-zinc-900 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-mono font-medium">{flag.key}</h3>
              <span className="text-xs text-zinc-500">
                Intended: {flag.intendedPlans.join(', ') || 'none'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {ALL_PLANS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    disabled={isPending}
                    checked={flag.enabledPlans.includes(value)}
                    onChange={() => togglePlan(flag, value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="email"
                placeholder="user@example.com"
                value={emailInputs[flag.key] ?? ''}
                onChange={(e) =>
                  setEmailInputs((s) => ({ ...s, [flag.key]: e.target.value }))
                }
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => applyOverride(flag.key, 'granted')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Grant
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => applyOverride(flag.key, 'denied')}
              >
                Deny
              </Button>
            </div>
            {flag.overrides.length > 0 && (
              <ul className="text-sm space-y-1">
                {flag.overrides.map((o) => (
                  <li key={o.userId} className="flex items-center gap-2">
                    <span>{o.email}</span>
                    <span className={o.mode === 'granted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                      {o.mode}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove override for ${o.email}`}
                      onClick={() => removeOverride(flag.key, o.email)}
                      className="text-zinc-400 hover:text-foreground"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
