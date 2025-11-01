import { NextRequest, NextResponse } from 'next/server';
import { PROBLEMS } from '@/lib/problems';
import { getAIResponse, getFeedback } from '@/lib/langgraph';
import { ChatMessage } from '@/types';

export async function POST(req: NextRequest) {
  const { input, slug, messages = [], phase = 'init' } = await req.json();
  const problem = PROBLEMS.find(p => p.slug === slug);
  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  // Convert messages back to ChatMessage type
  const chatMessages: ChatMessage[] = messages.map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.timestamp)
  }));

  let aiResponse: ChatMessage;
  let newPhase = phase;

  if (phase === 'init') {
    // Initial message
    aiResponse = {
      role: 'ai',
      content: `Welcome! Let's design ${problem.title}. Start by clarifying requirements.`,
      id: 'init',
      timestamp: new Date()
    };
    newPhase = 'requirements';
  } else if (phase === 'done') {
    // Get feedback
    try {
      const feedback = await getFeedback(problem, chatMessages);
      aiResponse = {
        role: 'ai',
        content: `Session complete. Here's your feedback.`,
        id: 'feedback',
        timestamp: new Date(),
        feedback
      };
    } catch (error) {
      aiResponse = {
        role: 'ai',
        content: 'Error generating feedback. Please try again.',
        id: 'error',
        timestamp: new Date()
      };
    }
  } else {
    // Get AI response
    try {
      aiResponse = await getAIResponse(problem, input, phase, chatMessages);
    } catch (error) {
      aiResponse = {
        role: 'ai',
        content: 'Error generating AI response. Please check your API key and try again.',
        id: 'error',
        timestamp: new Date()
      };
    }
    // Simple phase progression (can be improved)
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