import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getStepsForProblem } from '@/lib/problem-steps';
import PracticeUI from '@/components/PracticeUI';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessProblem } from '@/lib/access';
import { type PlanType } from '@/lib/plans';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ title?: string, description?: string }> }): Promise<Metadata> {
  const { title } = await searchParams;
  if (!title) {
    return {
      title: 'Custom Problem',
    };
  }
  return {
    title: `Practice ${title} - Ultimate SD`,
    description: `AI-powered practice for custom problem: ${title}.`,
  };
}

export default async function CustomPracticePage({ searchParams }: { searchParams: Promise<{ title?: string, description?: string }> }) {
  const { title, description } = await searchParams;

  if (!title) {
    redirect('/custom');
  }

  const session = await auth();
  if (!session?.user?.id) {
    const params = new URLSearchParams({ title, description: description || '' });
    redirect(`/login?callbackUrl=/custom/practice?${params.toString()}`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planType: true, planExpiresAt: true },
  });

  const deterministicSlug = `custom-${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`;

  if (!canAccessProblem(dbUser ? {
    planType: dbUser.planType as PlanType,
    planExpiresAt: dbUser.planExpiresAt,
  } : null, deterministicSlug)) {
    redirect(`/pricing?locked=${deterministicSlug}`);
  }

  const steps = getStepsForProblem(deterministicSlug);

  const problem = {
    id: deterministicSlug,
    title: title,
    slug: deterministicSlug,
    description: description || 'Custom user-defined system design challenge.',
    difficulty: 'Medium' as const,
    category: 'Custom',
    companies: [],
    requirements: [],
    steps
  };

  const existingProgress = await prisma.problemProgress.findUnique({
    where: {
      userId_problemId: {
        userId: session.user.id,
        problemId: problem.id
      }
    }
  });

  return <PracticeUI problem={problem} existingProgress={existingProgress} />;
}
