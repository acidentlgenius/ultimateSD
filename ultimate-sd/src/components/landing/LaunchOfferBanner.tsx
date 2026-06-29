'use client';

import Link from 'next/link';
import { Gift, Sparkles } from 'lucide-react';
import type { LaunchOfferPublicStats } from '@/lib/launch-offer';
import { LAUNCH_AI_WINNER_SLOTS, LAUNCH_PLATFORM_SLOTS } from '@/lib/launch-offer';

interface LaunchOfferBannerProps {
  stats: LaunchOfferPublicStats;
}

export function LaunchOfferBanner({ stats }: LaunchOfferBannerProps) {
  if (!stats.isActive) return null;

  const soldOut = stats.platformRemaining === 0;

  return (
    <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10 border border-primary/20 mb-8 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
        <span className="text-sm font-medium">Launch offer is live</span>
      </div>
      <span className="hidden sm:inline text-muted-foreground">·</span>
      <span className="text-sm text-muted-foreground text-center sm:text-left">
        {soldOut ? (
          <>Platform slots claimed — enter the AI giveaway ({LAUNCH_AI_WINNER_SLOTS} winners)</>
        ) : (
          <>
            <strong className="text-foreground">{stats.platformRemaining}</strong> of {LAUNCH_PLATFORM_SLOTS} free
            Platform plans left
          </>
        )}
      </span>
      <Link
        href="/pricing#launch-offer"
        className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
      >
        <Gift className="w-3.5 h-3.5" />
        Claim offer
      </Link>
    </div>
  );
}
