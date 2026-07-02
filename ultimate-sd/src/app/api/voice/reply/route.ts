import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PROBLEMS } from '@/lib/problems';
import { getStepsForProblem } from '@/lib/problem-steps';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';
import { getAIResponse } from '@/lib/langgraph';
import { requireVoiceAccess } from '../guard';
import type { ChatMessage } from '@/types';

export async function POST(req: NextRequest) {
  const access = await requireVoiceAccess();
  if (access instanceof NextResponse) return access;

  const { sessionId, transcript } = await req.json();
  if (typeof sessionId !== 'string' || typeof transcript !== 'string' || !transcript.trim()) {
    return NextResponse.json({ error: 'sessionId and transcript are required' }, { status: 400 });
  }

  const voiceSession = await prisma.voiceSession.findUnique({
    where: { id: sessionId },
    include: { turns: { orderBy: { createdAt: 'asc' }, take: 20 } },
  });
  if (!voiceSession || voiceSession.userId !== access.userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const problemMetadata = PROBLEMS.find((p) => p.id === voiceSession.problemId);
  if (!problemMetadata) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }
  const problem = { ...problemMetadata, steps: getStepsForProblem(problemMetadata.slug) };

  const history: ChatMessage[] = voiceSession.turns.map((turn) => ({
    id: turn.id,
    role: turn.role === 'candidate' ? ('user' as const) : ('ai' as const),
    content: turn.transcript,
    timestamp: turn.createdAt,
  }));

  try {
    // Platform-funded users are charged one AI credit per voice turn here.
    const { llm } = await getUserLLM(access.userId, { problemSlug: problemMetadata.slug });
    // NOTE: single swap point — when Plan C lands its interviewer probe persona
    // in src/lib/langgraph.ts, call it here instead of getAIResponse.
    const reply = await getAIResponse(
      problem,
      transcript,
      'voice interview (spoken, turn-based — keep the reply short and conversational)',
      history,
      llm
    );

    await prisma.voiceTurn.create({
      data: { voiceSessionId: sessionId, role: 'interviewer', transcript: reply.content },
    });

    return NextResponse.json({ text: reply.content });
  } catch (error) {
    if (error instanceof AIAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('voice reply error:', error);
    return NextResponse.json(
      { error: 'Failed to generate the interviewer reply. Please try again.' },
      { status: 502 }
    );
  }
}
