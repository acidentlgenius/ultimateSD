import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getHelpResponse } from '@/lib/help-langgraph';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problem, messages, currentPhase, completedSteps = [], savedStepData = [] } = await req.json();

    if (!problem || !messages) {
      return NextResponse.json(
        { error: 'Problem and messages are required' },
        { status: 400 }
      );
    }

    const conversationHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content
    }));

    const { llm } = await getUserLLM(session.user.id, { problemSlug: problem.slug });
    const response = await getHelpResponse({
      problem,
      currentPhase,
      completedSteps,
      savedStepData,
      conversationHistory
    }, llm);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Help assistant API error:', error);
    // AIAccessError messages are user-facing ("add an API key…"); anything
    // else is an internal detail that must not leak to the client.
    if (error instanceof AIAccessError) {
      return NextResponse.json({ error: 'ai_unavailable', message: error.message }, { status: 403 });
    }
    if (error instanceof Error && /rate.?limit|429|quota|resource.?exhausted/i.test(error.message)) {
      return NextResponse.json(
        { error: 'ai_rate_limited', message: 'The AI provider is rate-limiting requests. Wait a moment and try again.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'ai_failed', message: 'The assistant hit a temporary problem. Please ask again.' },
      { status: 502 }
    );
  }
}
