'use client';

import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  PlayCircle,
  XCircle,
  PenLine,
} from 'lucide-react';
import {
  AdminActivityItem,
  AdminActivityType,
  getActivityLabel,
} from '@/lib/admin-activities';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
}

interface AdminActivityFeedProps {
  activities: AdminActivityItem[];
  users: AdminUser[];
  initialUserId?: string;
}

type ActivityFilter = 'all' | AdminActivityType;

const TYPE_FILTERS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'session_started', label: 'Sessions Started' },
  { value: 'session_completed', label: 'Completed' },
  { value: 'session_abandoned', label: 'Abandoned' },
  { value: 'step_submitted', label: 'Step Submissions' },
];

export function AdminActivityFeed({
  activities,
  users,
  initialUserId,
}: AdminActivityFeedProps) {
  const [userFilter, setUserFilter] = useState(initialUserId ?? 'all');
  const [typeFilter, setTypeFilter] = useState<ActivityFilter>('all');

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (userFilter !== 'all' && activity.userId !== userFilter) return false;
      if (typeFilter !== 'all' && activity.type !== typeFilter) return false;
      return true;
    });
  }, [activities, userFilter, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="all">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ActivityFilter)}
          className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          {TYPE_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 py-12 text-center text-zinc-500">
          No activities match the current filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Problem
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      {getActivityIcon(activity.type)}
                      <span>{getActivityLabel(activity.type)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium">{activity.userName ?? 'No Name'}</div>
                    <div className="text-xs text-zinc-500">{activity.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{activity.problemTitle}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {renderDetails(activity)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getActivityIcon(type: AdminActivityType) {
  switch (type) {
    case 'session_started':
      return <PlayCircle className="h-4 w-4 text-blue-500" />;
    case 'session_completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'session_abandoned':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'step_submitted':
      return <PenLine className="h-4 w-4 text-purple-500" />;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function renderDetails(activity: AdminActivityItem) {
  if (activity.type === 'step_submitted') {
    return (
      <span>
        {activity.phase}/{activity.stepId}
        {activity.score != null && ` · Score: ${activity.score}`}
        {activity.isPassing != null && (
          <span className={activity.isPassing ? ' text-green-600' : ' text-amber-600'}>
            {' '}
            · {activity.isPassing ? 'Pass' : 'Fail'}
          </span>
        )}
      </span>
    );
  }

  return (
    <span>
      Attempt #{activity.attemptNumber}
      {activity.score != null && ` · Final score: ${activity.score}`}
    </span>
  );
}
