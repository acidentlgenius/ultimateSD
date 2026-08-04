import type { AgendaMove, PracticeMode, SessionState } from '@/lib/adaptive-coach/types';
import type { GateDecision } from '@/lib/adaptive-coach/types';
import { HttpError } from '@/lib/fetchUtils';

export type CoachTurnApiResponse = {
  sessionState: SessionState;
  ui: {
    agenda: AgendaMove[];
    feedback?: {
      score: number;
      accuracy: number;
      strengths: string[];
      weaknesses: string[];
      missed: string[];
      isAcceptable: boolean;
    };
    gate?: GateDecision;
    tip?: string;
  };
};

export function activeAgendaAsk(agenda: AgendaMove[]): AgendaMove | undefined {
  return (
    agenda.find((move) => move.kind === 'ask' || move.kind === 'probe') ??
    agenda.find((move) => move.kind === 'teach') ??
    agenda[0]
  );
}

/** Coach rails use `${phaseKey}-${index}` — same as classic `buildStepKey`. */
export function parseCoachStageId(stageId: string): { phaseKey: string; stepIndex: number } {
  const lastDash = stageId.lastIndexOf('-');
  if (lastDash === -1) {
    return { phaseKey: stageId, stepIndex: 0 };
  }
  const stepIndex = Number.parseInt(stageId.slice(lastDash + 1), 10);
  return {
    phaseKey: stageId.slice(0, lastDash),
    stepIndex: Number.isFinite(stepIndex) ? stepIndex : 0,
  };
}

export function seedCoachSessionState(args: {
  problemSlug: string;
  stageId: string;
  mode?: PracticeMode;
  agenda?: AgendaMove[];
}): SessionState {
  return {
    version: 'adaptive-1',
    mode: args.mode ?? 'practice',
    problemSlug: args.problemSlug,
    stageId: args.stageId,
    agenda: args.agenda ?? [],
    attempts: {},
    stageStartedAt: new Date().toISOString(),
    sessionBudgetSec: 0,
    status: 'running',
  };
}

export async function postCoachTurn(args: {
  problemSlug: string;
  mode?: PracticeMode;
  event:
    | { type: 'start' }
    | {
        type: 'submit';
        userAnswer: string;
        stageId: string;
        previousFeedback?: {
          weaknesses: string[];
          missed: string[];
        };
      }
    | { type: 'finish' };
  sessionState: SessionState | null;
}): Promise<CoachTurnApiResponse> {
  const res = await fetch('/api/ai/coach/turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problemSlug: args.problemSlug,
      mode: args.mode ?? 'practice',
      event: args.event,
      sessionState: args.sessionState,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : 'Adaptive coach turn failed.';
    // HttpError keeps status so UI can treat 402/403 as product states, not crashes.
    throw new HttpError(res.status, message);
  }

  return data as CoachTurnApiResponse;
}
