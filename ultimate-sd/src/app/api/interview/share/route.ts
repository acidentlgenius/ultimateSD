import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessFeature } from '@/lib/feature-flags-server';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await canAccessFeature(session.user.id, 'interviewMode'))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const { debriefId } = await req.json();
  if (typeof debriefId !== 'string' || !debriefId) {
    return NextResponse.json({ error: 'Invalid debriefId' }, { status: 400 });
  }

  const debrief = await prisma.interviewDebrief.findFirst({
    where: { id: debriefId, userId: session.user.id },
  });
  if (!debrief) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const share = await prisma.interviewDebriefShare.create({
    data: { debriefId: debrief.id },
  });

  const origin = req.nextUrl.origin;
  return NextResponse.json({ url: `${origin}/share/debrief/${share.token}` });
}
