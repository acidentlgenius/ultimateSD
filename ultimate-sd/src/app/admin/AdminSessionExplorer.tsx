'use client';

import { useMemo, useState, useTransition } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Loader2,
  PlayCircle,
  Timer,
  XCircle,
} from 'lucide-react';
import { fetchAdminSessionDetail } from '@/app/actions/admin-sessions';
import { SessionPhaseReview } from '@/components/profile/SessionPhaseReview';
import type { AdminSessionDetail, AdminSessionSummary } from '@/lib/admin-sessions-types';
import { SessionStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
}

interface AdminSessionExplorerProps {
  sessions: AdminSessionSummary[];
  users: AdminUser[];
  initialUserId?: string;
}

type StatusFilter = 'all' | SessionStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: SessionStatus.ACTIVE, label: 'In progress' },
  { value: SessionStatus.COMPLETED, label: 'Completed' },
  { value: SessionStatus.ABANDONED, label: 'Abandoned' },
];

export function AdminSessionExplorer({
  sessions,
  users,
  initialUserId,
}: AdminSessionExplorerProps) {
  const [userFilter, setUserFilter] = useState(initialUserId ?? 'all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<AdminSessionDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (userFilter !== 'all' && session.userId !== userFilter) return false;
      if (statusFilter !== 'all' && session.status !== statusFilter) return false;
      return true;
    });
  }, [sessions, userFilter, statusFilter]);

  const handleSelectSession = (sessionId: string) => {
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
      setSessionDetail(null);
      setDetailError(null);
      return;
    }

    setSelectedSessionId(sessionId);
    setSessionDetail(null);
    setDetailError(null);

    startTransition(async () => {
      const result = await fetchAdminSessionDetail(sessionId);
      if (result.error || !result.detail) {
        setDetailError(result.error ?? 'Session not found');
        return;
      }
      setSessionDetail(result.detail);
    });
  };

  return (
    <div className="space-y-6">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 py-12 text-center text-zinc-500">
          No practice sessions match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const isSelected = selectedSessionId === session.id;
            return (
              <div
                key={session.id}
                className={cn(
                  'rounded-lg border bg-white dark:bg-zinc-900 overflow-hidden transition-colors',
                  isSelected
                    ? 'border-primary/40 ring-1 ring-primary/20'
                    : 'border-zinc-200 dark:border-zinc-800'
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelectSession(session.id)}
                  className="w-full text-left px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <StatusIcon status={session.status} />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm">{session.problemTitle}</span>
                          <StatusBadge status={session.status} />
                          <span className="text-xs text-zinc-500">
                            Attempt #{session.attemptNumber}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {session.userName ?? 'No name'} · {session.userEmail}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started {format(new Date(session.startedAt), 'MMM d, yyyy · h:mm a')}
                          </span>
                          {session.completedAt && (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed {format(new Date(session.completedAt), 'MMM d, yyyy · h:mm a')}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {session.durationMinutes} min
                            {session.totalPausedSeconds > 0 &&
                              ` (${Math.round(session.totalPausedSeconds / 60)} min paused)`}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {session.passingCount}/{session.submissionCount} steps passed
                          </span>
                          {session.finalScore != null && (
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Award className="h-3 w-3 text-yellow-500" />
                              Final score: {session.finalScore}%
                            </span>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
                      {isSelected ? (
                        <>
                          Hide details
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          View full details
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {isSelected && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-6 bg-zinc-50/50 dark:bg-zinc-950/50">
                    {isPending && (
                      <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading session details…
                      </div>
                    )}
                    {!isPending && detailError && (
                      <p className="text-center text-red-500 py-8">{detailError}</p>
                    )}
                    {!isPending && sessionDetail && (
                      <SessionPhaseReview
                        session={sessionDetail}
                        showBackLink={false}
                        userName={sessionDetail.userName}
                        userEmail={sessionDetail.userEmail}
                      />
                    )}
                    {!isPending && !sessionDetail && !detailError && (
                      <p className="text-center text-zinc-500 py-8">
                        No detailed data available for this session.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: SessionStatus }) {
  switch (status) {
    case SessionStatus.COMPLETED:
      return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />;
    case SessionStatus.ACTIVE:
      return <PlayCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />;
    case SessionStatus.ABANDONED:
      return <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function StatusBadge({ status }: { status: SessionStatus }) {
  switch (status) {
    case SessionStatus.COMPLETED:
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
          Completed
        </span>
      );
    case SessionStatus.ACTIVE:
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400">
          In progress
        </span>
      );
    case SessionStatus.ABANDONED:
      return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-600 dark:text-zinc-400">
          Abandoned
        </span>
      );
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
