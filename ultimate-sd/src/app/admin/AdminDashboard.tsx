'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminClient } from './AdminClient';
import { AdminSessionExplorer } from './AdminSessionExplorer';
import { LaunchOfferPanel } from './LaunchOfferPanel';
import { FeatureFlagsPanel } from './FeatureFlagsPanel';
import { ProblemIntrosPanel } from './ProblemIntrosPanel';
import type { AdminSessionSummary } from '@/lib/admin-sessions-types';
import type { LaunchOfferPublicStats } from '@/lib/launch-offer';
import type { LaunchOfferClaimantRow, LaunchOfferRedemptionRow } from '@/lib/launch-offer-grant';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  planType: string;
  planExpiresAt: Date | null;
  xp: number;
  level: number;
  streak: number;
  completedProblems: number;
  createdAt: Date;
}

type AdminTab = 'users' | 'activities' | 'launch' | 'flags' | 'intros';

interface AdminDashboardProps {
  users: AdminUser[];
  sessions: AdminSessionSummary[];
  initialUserId?: string;
  launchStats: LaunchOfferPublicStats;
  launchRedemptions: LaunchOfferRedemptionRow[];
  launchClaimants: LaunchOfferClaimantRow[];
  userPage: number;
  userTotalPages: number;
  userTotalCount: number;
}

export function AdminDashboard({
  users,
  sessions,
  initialUserId,
  launchStats,
  launchRedemptions,
  launchClaimants,
  userPage,
  userTotalPages,
  userTotalCount,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>(initialUserId ? 'activities' : 'users');
  const [activityUserFilter, setActivityUserFilter] = useState(initialUserId ?? 'all');

  const handleViewActivity = (userId: string) => {
    setActivityUserFilter(userId);
    setTab('activities');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={cn(
            'flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
            tab === 'users'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          )}
        >
          User Management
        </button>
        <button
          type="button"
          onClick={() => setTab('activities')}
          className={cn(
            'flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
            tab === 'activities'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          )}
        >
          User Activities
        </button>
        <button
          type="button"
          onClick={() => setTab('launch')}
          className={cn(
            'flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
            tab === 'launch'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          )}
        >
          Launch Offer
        </button>
        <button
          type="button"
          onClick={() => setTab('flags')}
          className={cn(
            'flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
            tab === 'flags'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          )}
        >
          Feature Flags
        </button>
        <button
          type="button"
          onClick={() => setTab('intros')}
          className={cn(
            'flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
            tab === 'intros'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          )}
        >
          Problem Intros
        </button>
        <Link
          href="/admin/blog"
          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors text-center text-zinc-500 hover:text-foreground"
        >
          Blog
        </Link>
      </div>

      {tab === 'users' ? (
        <AdminClient
          users={users}
          launchStats={launchStats}
          onViewActivity={handleViewActivity}
          page={userPage}
          totalPages={userTotalPages}
          totalCount={userTotalCount}
        />
      ) : tab === 'activities' ? (
        <AdminSessionExplorer
          sessions={sessions}
          users={users.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
          initialUserId={activityUserFilter !== 'all' ? activityUserFilter : undefined}
        />
      ) : tab === 'launch' ? (
        <LaunchOfferPanel
          stats={launchStats}
          redemptions={launchRedemptions}
          claimants={launchClaimants}
        />
      ) : tab === 'flags' ? (
        <FeatureFlagsPanel />
      ) : (
        <ProblemIntrosPanel />
      )}
    </div>
  );
}
