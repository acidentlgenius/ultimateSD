import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type CoachTraceEvent = {
  at: string;
  skill: 'plan-agenda' | 'evaluate-for-level' | 'teach-forward' | string;
  problemSlug?: string;
  stageId?: string;
  /** Stable skill instructions (SystemMessage). */
  systemPrompt?: string;
  /** Session-specific payload (HumanMessage). */
  humanPrompt: string;
  llmRaw?: string;
  parsed?: unknown;
  meta?: Record<string, unknown>;
};

const TRACE_ENABLED =
  process.env.COACH_TRACE === '1' || process.env.COACH_TRACE === 'true';

const DEFAULT_PATH = join(
  process.cwd(),
  '.superpowers',
  'coach-trace.jsonl',
);

export function isCoachTraceEnabled(): boolean {
  return TRACE_ENABLED;
}

export function appendCoachTrace(event: CoachTraceEvent): void {
  if (!TRACE_ENABLED) return;
  try {
    const path = process.env.COACH_TRACE_PATH || DEFAULT_PATH;
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(event)}\n`, 'utf8');
  } catch (err) {
    console.error('coach-trace write failed', err);
  }
}
