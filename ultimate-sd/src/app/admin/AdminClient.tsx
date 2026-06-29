'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserPlan, revokeUserAccess } from '@/app/actions/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LAUNCH_PLATFORM_SLOTS,
  type LaunchOfferPublicStats,
} from '@/lib/launch-offer';
import { toast } from 'sonner';

interface AdminClientProps {
  users: Array<{
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
  }>;
  launchStats: LaunchOfferPublicStats;
  onViewActivity?: (userId: string) => void;
}

export function AdminClient({ users, launchStats, onViewActivity }: AdminClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [platformGrantUserId, setPlatformGrantUserId] = useState<string | null>(null);

  const platformGrantUser = users.find((u) => u.id === platformGrantUserId);
  const canUseLaunchSlot =
    launchStats.isActive && launchStats.platformRemaining > 0;

  const handleUpdatePlan = async (
    userId: string,
    planType: 'free' | 'platform' | 'ai',
    options?: { consumeLaunchOfferSlot?: boolean }
  ) => {
    setLoading(userId);
    try {
      const result = await updateUserPlan(userId, planType, options);
      if (result.error) {
        toast.error(result.error);
      } else if (planType !== 'free' && result.emailSent === false) {
        toast.success(`Plan updated to ${planType}`, {
          description: result.launchOfferSlotUsed
            ? 'Launch offer slot used. Welcome email could not be sent — check email configuration.'
            : 'Welcome email could not be sent. Check email configuration.',
        });
        router.refresh();
      } else {
        toast.success(
          planType === 'free'
            ? `Plan updated to ${planType}`
            : result.launchOfferSlotUsed
              ? `Platform plan granted using a launch offer slot (${launchStats.platformRemaining - 1} remaining). Welcome email sent.`
              : `Plan updated to ${planType}. Welcome email sent.`
        );
        router.refresh();
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(null);
      setPlatformGrantUserId(null);
    }
  };

  const handlePlatformGrantChoice = (consumeLaunchOfferSlot: boolean) => {
    if (!platformGrantUserId) return;
    void handleUpdatePlan(platformGrantUserId, 'platform', { consumeLaunchOfferSlot });
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke premium access for this user?')) return;

    setLoading(userId);
    try {
      const result = await revokeUserAccess(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Access revoked');
        router.refresh();
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Stats</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium">{u.name || 'No Name'}</div>
                      <div className="text-sm text-zinc-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-500">
                    <div>XP: {u.xp} | Lvl: {u.level}</div>
                    <div>Streak: {u.streak} | Solved: {u.completedProblems}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    u.planType === 'ai' ? 'bg-purple-100 text-purple-800' :
                    u.planType === 'platform' ? 'bg-blue-100 text-blue-800' :
                    'bg-zinc-100 text-zinc-800'
                  }`}>
                    {u.planType}
                  </span>
                  {u.planExpiresAt && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Expires: {new Date(u.planExpiresAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                  {u.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        disabled={loading === u.id || u.planType === 'free'}
                        onClick={() => void handleUpdatePlan(u.id, 'free')}
                        className="text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                      >
                        Set Free
                      </button>
                      <button
                        disabled={loading === u.id || u.planType === 'platform'}
                        onClick={() => setPlatformGrantUserId(u.id)}
                        className="text-xs text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Set Platform
                      </button>
                      <button
                        disabled={loading === u.id || u.planType === 'ai'}
                        onClick={() => void handleUpdatePlan(u.id, 'ai')}
                        className="text-xs text-purple-600 hover:text-purple-900 disabled:opacity-50"
                      >
                        Set AI
                      </button>
                    </div>
                    {u.planType !== 'free' && (
                      <button
                        disabled={loading === u.id}
                        onClick={() => void handleRevoke(u.id)}
                        className="text-xs text-red-600 hover:text-red-900 text-left disabled:opacity-50 mt-1"
                      >
                        Revoke Access
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onViewActivity?.(u.id)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 mt-1 text-left"
                    >
                      View Activity
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={platformGrantUserId !== null}
        onOpenChange={(open) => {
          if (!open && loading === null) {
            setPlatformGrantUserId(null);
          }
        }}
      >
        <DialogContent showCloseButton={loading === null}>
          <DialogHeader>
            <DialogTitle>Grant Platform plan</DialogTitle>
            <DialogDescription>
              {platformGrantUser
                ? `Grant 3 months of Platform access to ${platformGrantUser.email}.`
                : 'Grant 3 months of Platform access.'}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Use a launch offer slot? This decrements the public counter ({launchStats.platformClaimed} /{' '}
            {LAUNCH_PLATFORM_SLOTS} claimed).
          </p>

          {!launchStats.isActive && (
            <p className="text-sm text-amber-600">
              The launch offer period has ended. Slots cannot be used.
            </p>
          )}
          {launchStats.isActive && launchStats.platformRemaining === 0 && (
            <p className="text-sm text-amber-600">
              All launch offer platform slots are taken.
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setPlatformGrantUserId(null)}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => handlePlatformGrantChoice(false)}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Grant without slot
            </button>
            <button
              type="button"
              disabled={loading !== null || !canUseLaunchSlot}
              onClick={() => handlePlatformGrantChoice(true)}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Use launch offer slot
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
