import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { PROBLEMS } from '@/lib/problems';
import { toDebriefListItem } from '@/lib/interview-debrief';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await canAccessFeature(session.user.id, 'interviewMode'))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const rows = await prisma.interviewDebrief.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      problemSlug: true,
      variant: true,
      overallScore: true,
      verdict: true,
      createdAt: true,
    },
  });

  const debriefs = rows.map((row) => {
    const problem = PROBLEMS.find((p) => p.slug === row.problemSlug);
    return toDebriefListItem({ ...row, problemTitle: problem?.title });
  });

  return NextResponse.json({ debriefs });
}
