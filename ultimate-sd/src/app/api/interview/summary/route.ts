import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PROBLEMS } from '@/lib/problems';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';
import { getInterviewSummary, type InterviewSummaryInput } from '@/lib/langgraph';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await canAccessFeature(session.user.id, 'interviewMode'))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const { slug, answers } = await req.json();

  const problemMetadata = PROBLEMS.find((p) => p.slug === slug);
  if (!problemMetadata) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'No answers to summarize' }, { status: 400 });
  }

  try {
    const { llm } = await getUserLLM(session.user.id, {
      temperature: 0.3,
      problemSlug: slug,
    });
    const summary = await getInterviewSummary(
      problemMetadata,
      answers as InterviewSummaryInput[],
      llm
    );
    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof AIAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Interview summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
