import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import type { InterviewSummary } from '@/lib/langgraph';
import { InterviewDebriefViewer } from '@/components/InterviewDebriefViewer';

export default async function SharedDebriefPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const share = await prisma.interviewDebriefShare.findUnique({
    where: { token },
    include: { debrief: true },
  });

  if (!share) {
    notFound();
  }

  const problem = PROBLEMS.find((p) => p.slug === share.debrief.problemSlug);
  const summary = share.debrief.summaryJson as unknown as InterviewSummary;

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <InterviewDebriefViewer
        problemTitle={problem?.title ?? share.debrief.problemSlug}
        variant={share.debrief.variant}
        summary={summary}
        createdAt={share.debrief.createdAt}
      />
    </div>
  );
}
