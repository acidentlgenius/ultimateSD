import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getFeedback } from '@/lib/langgraph';
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

const messages = [];

function fakeLlm(content: string): BaseChatModel {
  return { invoke: vi.fn().mockResolvedValue({ content }) } as unknown as BaseChatModel;
}

const VALID_JSON = JSON.stringify({
  score: 8,
  tips: ['Good job', 'Use redis', 'Scale db']
});

describe('getFeedback', () => {
  it('parses a valid JSON feedback', async () => {
    const feedback = await getFeedback(problem, messages, fakeLlm(VALID_JSON));
    expect(feedback.score).toBe(8);
  });

  it('strips markdown fences before parsing', async () => {
    const fenced = '```json\n' + VALID_JSON + '\n```';
    const feedback = await getFeedback(problem, messages, fakeLlm(fenced));
    expect(feedback.score).toBe(8);
  });
});
