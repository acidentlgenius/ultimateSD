import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { runCoachTurn } from '@/lib/adaptive-coach';
import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import { canAccessFeature } from '@/lib/feature-flags-server';
import posthog from '@/lib/posthog';
import { getProblemBySlug } from '@/lib/problems';
import { getUserLLM, AIAccessError } from '@/lib/user-llm';

const AgendaMoveSchema = z.object({
  id: z.string(),
  kind: z.enum(['ask', 'probe', 'teach', 'skip', 'advance']),
  prompt: z.string(),
  skillFocus: z.array(z.string()),
  source: z.enum(['rail', 'rag', 'planner']),
});

const SessionStateSchema = z.object({
  version: z.literal('adaptive-1'),
  mode: z.enum(['practice', 'mock']),
  problemSlug: z.string(),
  stageId: z.string(),
  agenda: z.array(AgendaMoveSchema),
  attempts: z.record(z.string(), z.number()),
  stageStartedAt: z.string(),
  sessionBudgetSec: z.number(),
  status: z.enum(['running', 'complete', 'summary-error']),
});

const CoachTurnEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }),
  z.object({
    type: z.literal('submit'),
    userAnswer: z.string().min(1),
    stageId: z.string().min(1),
  }),
  z.object({
    type: z.literal('tick'),
    sessionRemainingSec: z.number().min(0),
  }),
  z.object({ type: z.literal('finish') }),
]);

const CoachTurnBodySchema = z.object({
  event: CoachTurnEventSchema,
  problemSlug: z.string().min(1),
  mode: z.enum(['practice', 'mock']),
  variant: z.enum(['lite', 'full']).optional(),
  sessionState: SessionStateSchema.nullable(),
});

function aiAccessStatus(error: AIAccessError): number {
  if (/credits/i.test(error.message)) return 402;
  return 403;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await canAccessFeature(session.user.id, 'adaptiveCoach'))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  let body: z.infer<typeof CoachTurnBodySchema>;
  try {
    body = CoachTurnBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const problem = getProblemBySlug(body.problemSlug);
  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  let llm;
  try {
    ({ llm } = await getUserLLM(session.user.id, {
      temperature: 0.3,
      problemSlug: body.problemSlug,
    }));
  } catch (error) {
    if (error instanceof AIAccessError) {
      return NextResponse.json(
        { error: 'ai_unavailable', message: error.message },
        { status: aiAccessStatus(error) }
      );
    }
    console.error('Coach turn LLM error:', error);
    return NextResponse.json(
      { error: 'ai_unavailable', message: 'AI coach not available.' },
      { status: 500 }
    );
  }

  try {
    const [response, profile] = await Promise.all([
      runCoachTurn({
        userId: session.user.id,
        problemSlug: body.problemSlug,
        difficulty: problem.difficulty,
        mode: body.mode,
        variant: body.variant,
        event: body.event,
        sessionState: body.sessionState,
        llm,
      }),
      loadProfile(session.user.id),
    ]);

    posthog.capture({
      distinctId: session.user.id,
      event: 'coach_turn',
      properties: {
        gateAction: response.ui.gate?.action,
        mode: body.mode,
        level: profile.level,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Coach turn error:', error);
    return NextResponse.json(
      { error: 'coach_failed', message: 'The adaptive coach hit a temporary problem. Please try again.' },
      { status: 502 }
    );
  }
}
