'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Key } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { claimLaunchPlatformAction } from '@/app/actions/launch-offer';
import { LaunchOfferCountdown } from '@/components/landing/LaunchOfferCountdown';
import {
  LAUNCH_OFFER_MONTHS,
  type LaunchOfferPublicStats,
  type LaunchOfferUserState,
} from '@/lib/launch-offer';
import { type PlanType } from '@/lib/plans';

interface ClaimPlatformAccessBannerProps {
  launchStats: LaunchOfferPublicStats;
  launchUserState: LaunchOfferUserState | null;
  planType: PlanType;
}

export function ClaimPlatformAccessBanner({
  launchStats,
  launchUserState,
  planType,
}: ClaimPlatformAccessBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canClaim =
    launchStats.isActive &&
    launchStats.platformRemaining > 0 &&
    !launchUserState?.hasRedeemed &&
    planType === 'free';

  if (!canClaim) return null;

  const handleClaim = () => {
    startTransition(async () => {
      const result = await claimLaunchPlatformAction();
      if ('error' in result) {
        const messages: Record<string, string> = {
          not_authenticated: 'Please sign in to claim.',
          offer_ended: 'Launch offer has ended.',
          already_redeemed: 'You already redeemed a launch offer.',
          sold_out: 'All launch slots are claimed.',
          has_paid_plan: 'You already have an active paid plan.',
        };
        toast.error(messages[result.error] ?? 'Could not claim');
        return;
      }
      toast.success(`Enjoy ${LAUNCH_OFFER_MONTHS} months of Platform access!`);
      router.refresh();
    });
  };

  return (
    <div className="container mx-auto px-4 pb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 max-w-6xl">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Key className="h-5 w-5 text-blue-500 shrink-0" />
          <span>
            <LaunchOfferCountdown prefix="Launch offer ends in" className="tabular-nums" /> · claim
            to enter AI lucky draw
          </span>
        </div>
        <Button
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          disabled={isPending}
          onClick={handleClaim}
        >
          {isPending ? 'Claiming…' : 'Claim Platform access'}
        </Button>
      </div>
    </div>
  );
}
