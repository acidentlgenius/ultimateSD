import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { PROBLEMS } from '@/lib/problems';
import { getPracticeSteps } from '@/lib/interview-lite-steps';
import PracticeUI from '@/components/PracticeUI';
import { FeatureUpsell } from '@/components/FeatureUpsell';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessProblem } from '@/lib/access';
import { type PlanType } from '@/lib/plans';
import { canAccessFeature } from '@/lib/feature-flags-server';
import {
  getInterviewConfig,
  getInterviewSteps,
  parseInterviewParam,
} from '@/lib/interview-mode';
import type { CanvasSnapshot } from '@/features/problem-flow-v2';

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
    description: `AI-powered practice for ${problem.title}. ${problem.context}`,
  };
}

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ interview?: string }>;
}) {
  const { slug } = await params;
  const { interview } = await searchParams;
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

  // V2 Canvas: check feature flag first, before any V1-specific data fetching
  const canvasV2Allowed = await canAccessFeature(session.user.id, 'problemFlowV2');

  // Mobile detection: V2 is desktop-only (< 768px always gets V1)
  // User-agent check is a heuristic; CSS media query handles the rest on client.
  const headersList = await headers();
  const ua = headersList.get('user-agent') ?? '';
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);

  if (canvasV2Allowed && !isMobile) {
    // V2 path — load canvas snapshot if it exists
    const { default: CanvasSessionUI } = await import('@/features/problem-flow-v2/CanvasSessionUI');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasProgress = await (prisma.problemProgress as any).findUnique({
      where: { userId_problemId: { userId: session.user.id, problemId: problemMetadata.id } },
      select: { canvasSnapshot: true },
    }) as { canvasSnapshot: unknown } | null;

    const snapshot = (canvasProgress?.canvasSnapshot ?? null) as CanvasSnapshot | null;

    return (
      <CanvasSessionUI
        slug={slug}
        title={problemMetadata.title}
        problemId={problemMetadata.id}
        userId={session.user.id}
        snapshot={snapshot}
      />
    );
  }

  const interviewAllowed = await canAccessFeature(session.user.id, 'interviewMode');
  const probeAllowed = await canAccessFeature(session.user.id, 'aiProbe');
  const voiceAllowed = await canAccessFeature(session.user.id, 'voiceInterview');
  const requestedVariant = parseInterviewParam(interview);
  if (requestedVariant && !interviewAllowed) {
    // Feature not launched for this user: pitch it instead of silently stripping the param.
    return (
      <FeatureUpsell
        feature="interviewMode"
        continueHref={`/practice/${slug}`}
        continueLabel="Practice without interview mode"
      />
    );
  }
  if (requestedVariant === 'voice' && interviewAllowed && !voiceAllowed) {
    return (
      <FeatureUpsell
        feature="voiceInterview"
        continueHref={`/practice/${slug}`}
        continueLabel="Practice without voice"
      />
    );
  }
  const interviewConfig =
    requestedVariant && interviewAllowed ? getInterviewConfig(requestedVariant) : null;

  const { steps, mode: stepMode } = getPracticeSteps(slug, problemMetadata.difficulty);
  const activeSteps = interviewConfig
    ? getInterviewSteps(slug, problemMetadata.difficulty, interviewConfig.variant)
    : steps;
  const problem = { ...problemMetadata, steps: activeSteps };

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

  const voiceEnabled = voiceAllowed;

  return (
    <PracticeUI
      problem={problem}
      stepMode={stepMode}
      existingProgress={progressForUI}
      interviewConfig={interviewConfig}
      interviewAllowed={interviewAllowed}
      probeEnabled={probeAllowed}
      voiceEnabled={voiceEnabled}
    />
  );
}
