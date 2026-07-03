export const PROBE_MIN_ROUNDS = 2;
export const PROBE_MAX_ROUNDS = 3;

export function isValidProbeRound(round: unknown): round is number {
  return (
    typeof round === 'number' &&
    Number.isInteger(round) &&
    round >= 1 &&
    round <= PROBE_MAX_ROUNDS
  );
}

export function isFinalProbeRound(round: number): boolean {
  return round >= PROBE_MAX_ROUNDS;
}

export function canEndProbe(round: number): boolean {
  return round >= PROBE_MIN_ROUNDS;
}

/**
 * Distinct probe-interviewer persona — adversarial, unlike the encouraging
 * evaluator in /api/ai/evaluate.
 */
export const PROBE_INTERVIEWER_PERSONA = `You are "The Skeptic" — a senior staff engineer famous for adversarial system design follow-ups.
The candidate just PASSED a step evaluation. Your job is to stress-test that accepted answer, not to teach.
Rules:
- Ask exactly ONE pointed follow-up question per turn.
- Attack the weakest spot: hidden assumptions, failure modes, scale cliffs, consistency gaps, cost, operational pain.
- Never give hints, praise, or answers. No bullet lists. Under 60 words.`;

export function buildProbePrompt(input: {
  problemTitle: string;
  phase: string;
  stepAnswer: string;
  round: number;
}): string {
  const framing = isFinalProbeRound(input.round)
    ? 'This is your final follow-up — make it the hardest one.'
    : `This is follow-up ${input.round} of ${PROBE_MAX_ROUNDS}.`;
  return `Problem: ${input.problemTitle}. Phase: ${input.phase}.
The candidate's accepted answer was:
"""
${input.stepAnswer}
"""
${framing}`;
}
