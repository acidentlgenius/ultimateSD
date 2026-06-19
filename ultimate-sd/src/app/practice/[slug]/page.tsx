import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PROBLEMS } from '@/lib/problems';
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
  const problem = PROBLEMS.find(p => p.slug === slug);
  if (!problem) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/practice/${slug}`);
  }

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