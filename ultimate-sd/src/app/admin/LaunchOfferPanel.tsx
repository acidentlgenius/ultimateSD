'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { drawAiGiveawayWinnersAction } from '@/app/actions/launch-offer';
import {
  LAUNCH_AI_WINNER_SLOTS,
  LAUNCH_PLATFORM_SLOTS,
  type LaunchOfferPublicStats,
} from '@/lib/launch-offer';
import type { LaunchOfferRedemptionRow } from '@/lib/launch-offer-grant';

interface LaunchOfferPanelProps {
  stats: LaunchOfferPublicStats;
  redemptions: LaunchOfferRedemptionRow[];
}

function formatKind(kind: LaunchOfferRedemptionRow['kind']): string {
  switch (kind) {
    case 'PLATFORM_LAUNCH':
      return 'Platform (FCFS)';
    case 'AI_GIVEAWAY':
      return 'AI Giveaway';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function LaunchOfferPanel({ stats, redemptions }: LaunchOfferPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDraw = () => {
    if (
      !confirm(
        `Draw up to ${LAUNCH_AI_WINNER_SLOTS - stats.aiWinners} AI giveaway winner(s) from ${stats.aiEntries} entries?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await drawAiGiveawayWinnersAction();

      if ('error' in result) {
        const messages: Record<string, string> = {
          giveaway_full: 'All AI giveaway slots are filled.',
          no_entries: 'No eligible giveaway entries to draw from.',
        };
        toast.error(messages[result.error] ?? 'Draw failed');
        return;
      }

      toast.success(
        `Drew ${result.winnerCount} winner(s).` +
          (result.emailFailures > 0 ? ` ${result.emailFailures} welcome email(s) failed.` : '')
      );
      router.refresh();
    });
  };

  const canDraw =
    stats.isActive &&
    stats.aiWinners < LAUNCH_AI_WINNER_SLOTS &&
    stats.aiEntries > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Platform launch claimed</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.platformClaimed} / {LAUNCH_PLATFORM_SLOTS}
          </p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">AI giveaway winners</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.aiWinners} / {LAUNCH_AI_WINNER_SLOTS}
          </p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Giveaway entries</p>
          <p className="text-2xl font-bold">{stats.aiEntries}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Offer status</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.isActive ? 'Active' : 'Ended'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button
          onClick={handleDraw}
          disabled={!canDraw || isPending}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Drawing…
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Draw AI winners
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          Randomly selects from users who entered and have not redeemed yet.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white dark:bg-zinc-900 shadow">
        <table className="min-w-[640px] w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Kind
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Granted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Expires
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {redemptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No launch offer redemptions yet.
                </td>
              </tr>
            ) : (
              redemptions.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{row.user.name ?? '—'}</div>
                    <div className="text-sm text-zinc-500">{row.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatKind(row.kind)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {new Date(row.grantedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {new Date(row.expiresAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
