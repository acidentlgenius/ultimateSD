import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { PROBLEMS } from '@/lib/problems';
import { prisma } from '@/lib/prisma';
import { toDebriefListItem } from '@/lib/interview-debrief';
import { InterviewHubClient } from './InterviewHubClient';

export default async function InterviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/interview');

  const [interviewEntitled, voiceEntitled] = await Promise.all([
    canAccessFeature(session.user.id, 'interviewMode'),
    canAccessFeature(session.user.id, 'voiceInterview'),
  ]);

  let debriefs: ReturnType<typeof toDebriefListItem>[] = [];
  if (interviewEntitled) {
    const rows = await prisma.interviewDebrief.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        problemSlug: true,
        variant: true,
        overallScore: true,
        verdict: true,
        createdAt: true,
      },
    });
    debriefs = rows.map((row) => {
      const p = PROBLEMS.find((x) => x.slug === row.problemSlug);
      return toDebriefListItem({ ...row, problemTitle: p?.title });
    });
  }

  return (
    <InterviewHubClient
      interviewEntitled={interviewEntitled}
      voiceEntitled={voiceEntitled}
      problems={PROBLEMS}
      debriefs={debriefs}
    />
  );
}
