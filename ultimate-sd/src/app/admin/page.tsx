import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminSessions } from '@/lib/admin-sessions';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user: filterUserId } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  const [users, sessions] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    getAdminSessions(200),
  ]);

  // Analytics
  const totalUsers = users.length;
  const premiumUsers = users.filter((u: any) => u.planType !== 'free').length;
  const aiUsers = users.filter((u: any) => u.planType === 'ai').length;
  const totalCompletedProblems = users.reduce((acc: number, u: any) => acc + u.completedProblems, 0);

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

      <AdminDashboard
        users={users}
        sessions={sessions}
        initialUserId={filterUserId}
      />
    </div>
  );
}
