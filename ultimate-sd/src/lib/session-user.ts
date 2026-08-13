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
    // Root cause: `findUnique` on email is case-sensitive, which can cause duplicate accounts or lookup failures.
    // Fix: Use `findFirst` with `mode: 'insensitive'` to reliably resolve IDs regardless of email casing.
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: sessionUser.email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }
  return null;
}

export const SESSION_STALE_MESSAGE =
  'Your session is out of date. Sign out and sign back in.';
