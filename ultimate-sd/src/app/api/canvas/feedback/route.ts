/**
 * POST /api/canvas/feedback
 *
 * Analyzes the user's canvas content for a given stage and returns
 * structured feedback (label + body).
 *
 * Auth: session required
 * Rate: 1 request per stage per session (enforced client-side; server logs but doesn't block)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { STAGE_META } from '@/features/problem-flow-v2/data/canvas-data';
import type { StageIndex, Seniority, CanvasContent } from '@/features/problem-flow-v2';

const llm = new ChatAnthropic({
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 300,
});

interface FeedbackRequest {
  stage: StageIndex;
  seniority: Seniority;
  slug: string;
  content: CanvasContent;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as FeedbackRequest;
  const { stage, seniority, slug, content } = body;

  if (typeof stage !== 'number' || stage < 0 || stage > 6) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
  }

  const stageMeta = STAGE_META[stage];
  const userText = Object.entries(content)
    .filter(([key]) => key.startsWith(getStagePrefixForStage(stage)))
    .map(([key, val]) => `[${key}]: ${val}`)
    .join('\n');

  if (!userText.trim()) {
    return NextResponse.json({ error: 'No content to review' }, { status: 400 });
  }

  try {
    const response = await llm.invoke([
      new HumanMessage(buildPrompt(stageMeta.label, seniority, slug, userText)),
    ]);

    const text = typeof response.content === 'string' ? response.content : '';
    const { label, body: feedbackBody } = parseResponse(text);

    return NextResponse.json({ label, body: feedbackBody });
  } catch (err) {
    console.error('[canvas/feedback]', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}

function getStagePrefixForStage(stage: StageIndex): string {
  const prefixes: Record<StageIndex, string> = {
    0: 'problem',
    1: 'fr',
    2: 'nfr',
    3: 'entities',
    4: 'api',
    5: 'hld',
    6: 'dd',
  };
  return prefixes[stage];
}

function buildPrompt(stageLabel: string, seniority: Seniority, slug: string, userContent: string): string {
  return `You are reviewing a system design candidate's work on the "${stageLabel}" stage for the problem: ${slug}.
Their seniority level is: ${seniority}.

Their response:
${userContent}

Give brief, actionable feedback in 2-3 sentences. Start with a 3-5 word label (e.g. "Strong fundamentals", "Missing scale analysis", "Good depth"). Then give specific feedback.

Format:
LABEL: [3-5 words]
BODY: [2-3 sentences of specific feedback]`;
}

function parseResponse(text: string): { label: string; body: string } {
  const labelMatch = text.match(/LABEL:\s*(.+)/);
  const bodyMatch = text.match(/BODY:\s*([\s\S]+)/);
  return {
    label: labelMatch?.[1]?.trim() ?? 'AI Feedback',
    body: bodyMatch?.[1]?.trim() ?? text.trim(),
  };
}
