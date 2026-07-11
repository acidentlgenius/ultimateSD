/**
 * POST /api/canvas/progress
 *
 * Persists the user's canvas snapshot (stage, seniority, content) to the DB.
 * Upserts ProblemProgress.canvasSnapshot.
 *
 * Auth: session required — userId in body must match session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { CanvasSnapshot } from '@/features/problem-flow-v2';

interface ProgressRequest {
  problemId: string;
  userId: string;
  snapshot: CanvasSnapshot;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as ProgressRequest;
  const { problemId, userId, snapshot } = body;

  // Prevent a user from writing to another user's progress
  if (userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!problemId || !snapshot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.problemProgress as any).upsert({
      where: {
        userId_problemId: { userId, problemId },
      },
      update: {
        canvasSnapshot: snapshot as object,
        canvasStage: snapshot.stage,
      },
      create: {
        userId,
        problemId,
        canvasSnapshot: snapshot as object,
        canvasStage: snapshot.stage,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[canvas/progress]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get('problemId');

  if (!problemId) {
    return NextResponse.json({ error: 'Missing problemId' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const progress = await (prisma.problemProgress as any).findUnique({
    where: { userId_problemId: { userId: session.user.id, problemId } },
    select: { canvasSnapshot: true, canvasStage: true },
  }) as { canvasSnapshot: object | null; canvasStage: number | null } | null;

  return NextResponse.json({
    snapshot: progress?.canvasSnapshot ?? null,
    stage: progress?.canvasStage ?? 0,
  });
}
