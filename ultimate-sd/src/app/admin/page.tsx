import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminSessions } from '@/lib/admin-sessions';
import { getLaunchOfferPlatformClaimants } from '@/lib/launch-offer-grant';
import {
  getLaunchOfferRedemptions,
  getLaunchOfferStats,
} from '@/app/actions/launch-offer';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LAUNCH_AI_WINNER_SLOTS, LAUNCH_PLATFORM_SLOTS } from '@/lib/launch-offer';

export const ADMIN_PAGE_SIZE = 50;

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  planType: true,
  planExpiresAt: true,
  xp: true,
  level: true,
  streak: true,
  completedProblems: true,
  createdAt: true,
} as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; page?: string }>;
}) {
  const { user: filterUserId, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  const [
    users,
    totalUsers,
    premiumUsers,
    aiUsers,
    completedAggregate,
    sessions,
    launchStats,
    launchRedemptions,
    launchClaimants,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      select: adminUserSelect,
    }),
    prisma.user.count(),
    prisma.user.count({ where: { planType: { not: 'free' } } }),
    prisma.user.count({ where: { planType: 'ai' } }),
    prisma.user.aggregate({ _sum: { completedProblems: true } }),
    getAdminSessions(200),
    getLaunchOfferStats(),
    getLaunchOfferRedemptions(),
    getLaunchOfferPlatformClaimants(),
  ]);

  const totalCompletedProblems = completedAggregate._sum.completedProblems ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / ADMIN_PAGE_SIZE));

  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Premium Users</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-600">{premiumUsers}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">AI Plan Users</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-purple-600">{aiUsers}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Total Problems Solved</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalCompletedProblems}</div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Launch Platform Claimed</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {launchStats.platformClaimed} / {LAUNCH_PLATFORM_SLOTS}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">AI Giveaway Winners</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-pink-600">
                  {launchStats.aiWinners} / {LAUNCH_AI_WINNER_SLOTS}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">AI Draw Eligible</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-cyan-600">{launchStats.aiEligible}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Launch Offer</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {launchStats.isActive ? 'Active' : 'Ended'}
                </div>
            </CardContent>
        </Card>
      </div>

      <AdminDashboard
        users={users}
        sessions={sessions}
        initialUserId={filterUserId}
        launchStats={launchStats}
        launchRedemptions={launchRedemptions}
        launchClaimants={launchClaimants}
        userPage={page}
        userTotalPages={totalPages}
        userTotalCount={totalUsers}
      />
    </div>
  );
}
