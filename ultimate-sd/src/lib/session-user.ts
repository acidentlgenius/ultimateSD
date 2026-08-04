import { prisma } from '@/lib/prisma';

/**
 * Resolve a durable user id from the NextAuth session user.
 * JWT can point at a wiped/re-seeded id after local db push; recover via email.
 */
export async function resolveSessionUserId(
  sessionUser: { id?: string | null; email?: string | null }
): Promise<string | null> {
  if (sessionUser.id) {
    const byId = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true },
    });
    if (byId) return byId.id;
  }
  if (sessionUser.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }
  return null;
}

export const SESSION_STALE_MESSAGE =
  'Your session is out of date. Sign out and sign back in.';
