import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PROBLEMS } from '@/lib/problems';
import { getStepsForProblem } from '@/lib/problem-steps';
import PracticeUI from '@/components/PracticeUI';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

  const steps = getStepsForProblem(slug);
  const problem = { ...problemMetadata, steps };

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
