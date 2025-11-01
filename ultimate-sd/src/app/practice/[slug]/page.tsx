import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { PROBLEMS } from '@/lib/problems';
import ChatInterface from '@/components/ChatInterface';
import DiagramCanvas from '@/components/DiagramCanvas';
import FeedbackModal from '@/components/FeedbackModal';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = PROBLEMS.find(p => p.slug === slug);
  if (!problem) {
    return {
      title: 'Problem Not Found',
    };
  }
  return {
    title: `Practice ${problem.title} - SysDesignAI`,
    description: `AI-powered practice for ${problem.title}. ${problem.description}`,
  };
}

export default async function PracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = PROBLEMS.find(p => p.slug === slug);
  if (!problem) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-2rem)]">
          <div className="lg:w-2/3 flex flex-col">
            <ChatInterface problem={problem} />
          </div>
          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="flex-1">
              <DiagramCanvas />
            </div>
            <div className="flex-shrink-0">
              <FeedbackModal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}