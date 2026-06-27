'use client';

import { useState } from 'react';
import { AdminClient } from './AdminClient';
import { AdminActivityFeed } from './AdminActivityFeed';
import type { AdminActivityItem } from '@/lib/admin-activities-types';
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

type AdminTab = 'users' | 'activities';

interface AdminDashboardProps {
  users: AdminUser[];
  activities: AdminActivityItem[];
  initialUserId?: string;
}

export function AdminDashboard({ users, activities, initialUserId }: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>(initialUserId ? 'activities' : 'users');
  const [activityUserFilter, setActivityUserFilter] = useState(initialUserId ?? 'all');

  const handleViewActivity = (userId: string) => {
    setActivityUserFilter(userId);
    setTab('activities');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
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
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            tab === 'activities'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          )}
        >
          User Activities
        </button>
      </div>

      {tab === 'users' ? (
        <AdminClient users={users} onViewActivity={handleViewActivity} />
      ) : (
        <AdminActivityFeed
          activities={activities}
          users={users.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
          initialUserId={activityUserFilter !== 'all' ? activityUserFilter : undefined}
        />
      )}
    </div>
  );
}
