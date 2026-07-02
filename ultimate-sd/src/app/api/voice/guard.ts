import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';

/**
 * Shared auth + 'voiceInterview' flag gate for all /api/voice/* routes.
 * Returns { userId } on success or a NextResponse (401/403) to return as-is.
 */
export async function requireVoiceAccess(): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await canAccessFeature(session.user.id, 'voiceInterview'))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }
  return { userId: session.user.id };
}
