import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  return session.user.id;
}
