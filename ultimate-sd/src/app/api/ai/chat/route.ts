import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PROBLEMS } from '@/lib/problems';
import { getStepsForProblem } from '@/lib/problem-steps';
import { getAIResponse, getFeedback } from '@/lib/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatMessage } from '@/types';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { input, slug, messages = [], phase = 'init' } = await req.json();
  const problemMetadata = PROBLEMS.find(p => p.slug === slug);
  if (!problemMetadata) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const steps = getStepsForProblem(slug);
  const problem = { ...problemMetadata, steps };

  const chatMessages: ChatMessage[] = messages.map((msg: ChatMessage & { timestamp: string }) => ({
    ...msg,
    timestamp: new Date(msg.timestamp)
  }));

  let aiResponse: ChatMessage;
  let newPhase = phase;

  if (phase === 'init') {
    aiResponse = {
      role: 'ai',
      content: `Welcome! Let's design ${problem.title}. Start by clarifying requirements.`,
      id: 'init',
      timestamp: new Date()
    };
    newPhase = 'requirements';
  } else if (phase === 'done') {
    try {
      const { llm } = await getUserLLM(session.user.id, { problemSlug: slug });
      const feedback = await getFeedback(problem, chatMessages, llm);
      aiResponse = {
        role: 'ai',
        content: `Session complete. Here's your feedback.`,
        id: 'feedback',
        timestamp: new Date(),
        feedback
      };
    } catch (error) {
      const message = error instanceof AIAccessError
        ? error.message
        : 'Error generating feedback. Please try again.';
      aiResponse = {
        role: 'ai',
        content: message,
        id: 'error',
        timestamp: new Date()
      };
    }
  } else {
    try {
      const { llm } = await getUserLLM(session.user.id, { problemSlug: slug });
      aiResponse = await getAIResponse(problem, input, phase, chatMessages, llm);
    } catch (error) {
      const message = error instanceof AIAccessError
        ? error.message
        : 'Error generating AI response. Please try again.';
      aiResponse = {
        role: 'ai',
        content: message,
        id: 'error',
        timestamp: new Date()
      };
    }

    if (phase === 'requirements') newPhase = 'hld';
    else if (phase === 'hld') newPhase = 'lld';
    else if (phase === 'lld') newPhase = 'tradeoffs';
    else if (phase === 'tradeoffs') newPhase = 'scalability';
    else newPhase = 'done';
  }

  const updatedMessages = [...chatMessages, aiResponse];

  return NextResponse.json({
    message: aiResponse,
    phase: newPhase,
    messages: updatedMessages
  });
}
