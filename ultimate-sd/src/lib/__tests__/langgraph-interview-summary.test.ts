import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getInterviewSummary } from '@/lib/langgraph';
import type { SystemDesignProblem } from '@/types';

const problem: SystemDesignProblem = {
  id: 'p1',
  title: 'Design TinyURL',
  slug: 'design-tinyurl',
  context: 'URL shortening service',
  difficulty: 'Easy',
  category: 'Web',
  companies: [],
  functionalRequirements: [],
  nonFunctionalRequirements: [],
};

const answers = [
  { phase: 'Requirements', title: 'Functional Requirements', answer: 'Shorten URL\nRedirect', passed: true },
  { phase: 'HLD', title: 'High-Level Architecture', answer: '(not attempted — ran out of time)', passed: false },
];

function fakeLlm(content: string): BaseChatModel {
  return { invoke: vi.fn().mockResolvedValue({ content }) } as unknown as BaseChatModel;
}

const VALID_JSON = JSON.stringify({
  overallScore: 7,
  verdict: 'Lean Hire',
  strengths: ['Clear requirements'],
  improvements: ['Manage time to reach HLD'],
  phaseNotes: [{ phase: 'Requirements', comment: 'Solid start.' }],
});

describe('getInterviewSummary', () => {
  it('parses a valid JSON debrief', async () => {
    const summary = await getInterviewSummary(problem, answers, fakeLlm(VALID_JSON));
    expect(summary).toEqual(JSON.parse(VALID_JSON));
  });

  it('strips markdown fences before parsing', async () => {
    const fenced = '```json\n' + VALID_JSON + '\n```';
    const summary = await getInterviewSummary(problem, answers, fakeLlm(fenced));
    expect(summary?.verdict).toBe('Lean Hire');
  });

  it('includes every answer and its pass status in the prompt', async () => {
    const llm = fakeLlm(VALID_JSON);
    await getInterviewSummary(problem, answers, llm);
    const invoke = (llm as unknown as { invoke: ReturnType<typeof vi.fn> }).invoke;
    const promptText = String(invoke.mock.calls[0][0][0].content);
    expect(promptText).toContain('Functional Requirements');
    expect(promptText).toContain('not attempted');
    expect(promptText).toContain('Design TinyURL');
  });

  it('returns null on unparseable output', async () => {
    expect(await getInterviewSummary(problem, answers, fakeLlm('sorry, no JSON'))).toBeNull();
  });

  it('returns null when no llm is available', async () => {
    expect(await getInterviewSummary(problem, answers, null)).toBeNull();
  });
});
