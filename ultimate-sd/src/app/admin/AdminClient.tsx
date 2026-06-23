'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserPlan, revokeUserAccess } from '@/app/actions/admin';
import { toast } from 'sonner';

export function AdminClient({ users }: { users: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdatePlan = async (userId: string, planType: 'free' | 'platform' | 'ai') => {
    setLoading(userId);
    try {
      const result = await updateUserPlan(userId, planType);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Plan updated to ${planType}`);
        router.refresh();
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(null);
    }
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
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
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
                      onClick={() => handleUpdatePlan(u.id, 'free')}
                      className="text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                    >
                      Set Free
                    </button>
                    <button
                      disabled={loading === u.id || u.planType === 'platform'}
                      onClick={() => handleUpdatePlan(u.id, 'platform')}
                      className="text-xs text-blue-600 hover:text-blue-900 disabled:opacity-50"
                    >
                      Set Platform
                    </button>
                    <button
                      disabled={loading === u.id || u.planType === 'ai'}
                      onClick={() => handleUpdatePlan(u.id, 'ai')}
                      className="text-xs text-purple-600 hover:text-purple-900 disabled:opacity-50"
                    >
                      Set AI
                    </button>
                  </div>
                  {u.planType !== 'free' && (
                    <button
                      disabled={loading === u.id}
                      onClick={() => handleRevoke(u.id)}
                      className="text-xs text-red-600 hover:text-red-900 text-left disabled:opacity-50 mt-1"
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
