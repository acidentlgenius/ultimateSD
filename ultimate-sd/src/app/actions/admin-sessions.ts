'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  getAdminSessionDetailById,
  getAdminSessions,
} from '@/lib/admin-sessions';
import type { AdminSessionDetail } from '@/lib/admin-sessions-types';

async function requireAdmin() {
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
}

export async function fetchAdminSessionDetail(
  sessionId: string
): Promise<{ detail: AdminSessionDetail | null; error?: string }> {
  try {
    await requireAdmin();
    const detail = await getAdminSessionDetailById(sessionId);
    return { detail };
  } catch (error) {
    console.error('Failed to fetch admin session detail:', error);
    return { detail: null, error: 'Failed to load session details' };
  }
}

export async function fetchAdminSessions(limit = 200) {
  try {
    await requireAdmin();
    return { sessions: await getAdminSessions(limit) };
  } catch (error) {
    console.error('Failed to fetch admin sessions:', error);
    return { sessions: [], error: 'Failed to load sessions' };
  }
}
