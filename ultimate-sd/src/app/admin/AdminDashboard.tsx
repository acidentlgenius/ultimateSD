'use client';

import { useState } from 'react';
import { AdminClient } from './AdminClient';
import { AdminSessionExplorer } from './AdminSessionExplorer';
import { LaunchOfferPanel } from './LaunchOfferPanel';
import type { AdminSessionSummary } from '@/lib/admin-sessions-types';
import type { LaunchOfferPublicStats } from '@/lib/launch-offer';
import type { LaunchOfferRedemptionRow } from '@/lib/launch-offer-grant';
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

type AdminTab = 'users' | 'activities' | 'launch';

interface AdminDashboardProps {
  users: AdminUser[];
  sessions: AdminSessionSummary[];
  initialUserId?: string;
  launchStats: LaunchOfferPublicStats;
  launchRedemptions: LaunchOfferRedemptionRow[];
}

export function AdminDashboard({
  users,
  sessions,
  initialUserId,
  launchStats,
  launchRedemptions,
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
      </div>

      {tab === 'users' ? (
        <AdminClient users={users} onViewActivity={handleViewActivity} />
      ) : tab === 'activities' ? (
        <AdminSessionExplorer
          sessions={sessions}
          users={users.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
          initialUserId={activityUserFilter !== 'all' ? activityUserFilter : undefined}
        />
      ) : (
        <LaunchOfferPanel stats={launchStats} redemptions={launchRedemptions} />
      )}
    </div>
  );
}
