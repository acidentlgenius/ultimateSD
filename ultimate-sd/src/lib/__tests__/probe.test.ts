import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  PROBE_INTERVIEWER_PERSONA,
  PROBE_MAX_ROUNDS,
  PROBE_MIN_ROUNDS,
  buildProbePrompt,
  canEndProbe,
  isFinalProbeRound,
  isValidProbeRound,
} from '@/lib/probe';
import { getProbeResponse } from '@/lib/langgraph';
import type { SystemDesignProblem } from '@/types';

describe('probe round rules', () => {
  it('allows 2-3 adversarial follow-ups', () => {
    expect(PROBE_MIN_ROUNDS).toBe(2);
    expect(PROBE_MAX_ROUNDS).toBe(3);
  });

  it('validates round numbers', () => {
    expect(isValidProbeRound(1)).toBe(true);
    expect(isValidProbeRound(3)).toBe(true);
    expect(isValidProbeRound(0)).toBe(false);
    expect(isValidProbeRound(4)).toBe(false);
    expect(isValidProbeRound(1.5)).toBe(false);
    expect(isValidProbeRound('1')).toBe(false);
  });

  it('marks the final round and the early-exit point', () => {
    expect(isFinalProbeRound(3)).toBe(true);
    expect(isFinalProbeRound(2)).toBe(false);
    expect(canEndProbe(2)).toBe(true);
    expect(canEndProbe(1)).toBe(false);
  });
});

describe('probe persona and prompt', () => {
  it('persona is adversarial: one question, no hints, no answers', () => {
    expect(PROBE_INTERVIEWER_PERSONA).toContain('ONE pointed follow-up question');
    expect(PROBE_INTERVIEWER_PERSONA).toContain('Never give hints');
  });

  it('prompt embeds problem, phase, accepted answer, and round framing', () => {
    const prompt = buildProbePrompt({
      problemTitle: 'Design TinyURL',
      phase: 'HLD',
      stepAnswer: 'LB -> app -> Postgres with Redis cache',
      round: 1,
    });
    expect(prompt).toContain('Design TinyURL');
    expect(prompt).toContain('HLD');
    expect(prompt).toContain('Redis cache');
    expect(prompt).toContain(`follow-up 1 of ${PROBE_MAX_ROUNDS}`);
  });

  it('final round asks for the hardest question', () => {
    const prompt = buildProbePrompt({
      problemTitle: 'Design TinyURL',
      phase: 'HLD',
      stepAnswer: 'x',
      round: PROBE_MAX_ROUNDS,
    });
    expect(prompt).toContain('final follow-up');
  });
});

describe('getProbeResponse', () => {
  const problem: SystemDesignProblem = {
    id: 'p1',
    title: 'Design TinyURL',
    slug: 'design-tinyurl',
    description: 'URL shortening service',
    difficulty: 'Easy',
    category: 'Web',
    companies: [],
    requirements: [],
  };

  it('sends the persona as a system message and returns an ai ChatMessage', async () => {
    const invoke = vi.fn().mockResolvedValue({ content: 'What breaks first at 10x traffic?' });
    const llm = { invoke } as unknown as BaseChatModel;

    const message = await getProbeResponse(problem, 'HLD', 'LB -> app -> DB', [], 1, llm);

    expect(message.role).toBe('ai');
    expect(message.content).toBe('What breaks first at 10x traffic?');
    const [systemMsg, humanMsg] = invoke.mock.calls[0][0];
    expect(String(systemMsg.content)).toBe(PROBE_INTERVIEWER_PERSONA);
    expect(String(humanMsg.content)).toContain('Design TinyURL');
  });

  it('includes prior probe exchanges in the prompt', async () => {
    const invoke = vi.fn().mockResolvedValue({ content: 'And when the cache dies?' });
    const llm = { invoke } as unknown as BaseChatModel;
    const history = [
      { role: 'ai' as const, content: 'Why Redis?', id: '1', timestamp: new Date() },
      { role: 'user' as const, content: 'Hot key reads', id: '2', timestamp: new Date() },
    ];

    await getProbeResponse(problem, 'HLD', 'answer', history, 2, llm);

    const humanText = String(invoke.mock.calls[0][0][1].content);
    expect(humanText).toContain('Interviewer: Why Redis?');
    expect(humanText).toContain('Candidate: Hot key reads');
  });
});
