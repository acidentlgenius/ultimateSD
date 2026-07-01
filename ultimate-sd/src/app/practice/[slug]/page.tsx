import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PROBLEMS } from '@/lib/problems';
import { getPracticeSteps } from '@/lib/interview-lite-steps';
import PracticeUI from '@/components/PracticeUI';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessProblem } from '@/lib/access';
import { type PlanType } from '@/lib/plans';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = PROBLEMS.find(p => p.slug === slug);
  if (!problem) {
    return {
      title: 'Problem Not Found',
    };
  }
  return {
    title: `Practice ${problem.title} - Ultimate SD`,
    description: `AI-powered practice for ${problem.title}. ${problem.description}`,
  };
}

export default async function PracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problemMetadata = PROBLEMS.find(p => p.slug === slug);

  if (!problemMetadata) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/practice/${slug}`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planType: true, planExpiresAt: true },
  });

  if (!canAccessProblem(dbUser ? {
    planType: dbUser.planType as PlanType,
    planExpiresAt: dbUser.planExpiresAt,
  } : null, slug)) {
    redirect(`/pricing?locked=${slug}`);
  }

  const { steps, mode: stepMode } = getPracticeSteps(slug, problemMetadata.difficulty);
  const problem = { ...problemMetadata, steps };

  const existingProgress = await prisma.problemProgress.findUnique({
    where: {
      userId_problemId: {
        userId: session.user.id,
        problemId: problem.id,
      },
    },
    include: { activeSession: true },
  });

  const progressForUI = existingProgress
    ? {
        ...existingProgress,
        startedAt: existingProgress.startedAt ?? existingProgress.activeSession?.startedAt,
        isTimerRunning: existingProgress.activeSession?.isTimerRunning ?? true,
        totalPausedSeconds: existingProgress.activeSession?.totalPausedSeconds ?? 0,
        lastPausedAt: existingProgress.activeSession?.lastPausedAt ?? null,
      }
    : null;

  return <PracticeUI problem={problem} stepMode={stepMode} existingProgress={progressForUI} />;
}
