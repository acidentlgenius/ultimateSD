import { NextRequest, NextResponse } from 'next/server';
import { getHelpResponse } from '@/lib/help-langgraph';

export async function POST(req: NextRequest) {
  try {
    const { problem, messages, currentPhase, completedSteps = [], savedStepData = [] } = await req.json();

    if (!problem || !messages) {
      return NextResponse.json(
        { error: 'Problem and messages are required' },
        { status: 400 }
      );
    }

    // Convert messages to conversation history format
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Call LangGraph-based help system with full context
    const response = await getHelpResponse({
      problem,
      currentPhase,
      completedSteps,
      savedStepData,
      conversationHistory
    });

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Help assistant API error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to get help response';
    return NextResponse.json(
      { message: `Sorry, I encountered an error: ${errMsg}. Please try again.` },
      { status: 500 }
    );
  }
}
