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

    const { llm } = await getUserLLM(session.user.id);
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
    const errMsg = error instanceof AIAccessError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Failed to get help response';
    return NextResponse.json(
      { message: errMsg },
      { status: error instanceof AIAccessError ? 403 : 500 }
    );
  }
}
