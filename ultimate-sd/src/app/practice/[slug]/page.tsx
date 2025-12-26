import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { PROBLEMS } from '@/lib/problems';
import { getStepsForProblem } from '@/lib/problem-steps';
import PracticeUI from '@/components/PracticeUI';

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

  const steps = getStepsForProblem(slug);
  const problem = { ...problemMetadata, steps };

  return <PracticeUI problem={problem} />;
}