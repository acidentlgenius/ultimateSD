import { describe, it, expect, vi } from 'vitest';
import { getFeedback } from '../langgraph';
import type { ChatMessage, SystemDesignProblem } from '@/types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

const mockProblem: SystemDesignProblem = {
  id: 'p1',
  slug: 'test-problem',
  title: 'Test Problem',
  context: 'A test problem',
  steps: [],
};

const mockMessages: ChatMessage[] = [];

describe('getFeedback', () => {
  it('parses valid JSON response', async () => {
    const validJson = '{"score": 8, "tips": ["tip1", "tip2"]}';
    const fakeLlm = {
      invoke: vi.fn().mockResolvedValue({ content: validJson }),
    } as unknown as BaseChatModel;

    const result = await getFeedback(mockProblem, mockMessages, fakeLlm);
    expect(result).toEqual({ score: 8, "tips": ["tip1", "tip2"] });
  });

  it('strips markdown fences before parsing JSON', async () => {
    const fencedJson = '```json\n{"score": 7, "tips": ["tip3", "tip4"]}\n```';
    const fakeLlm = {
      invoke: vi.fn().mockResolvedValue({ content: fencedJson }),
    } as unknown as BaseChatModel;

    const result = await getFeedback(mockProblem, mockMessages, fakeLlm);
    expect(result).toEqual({ score: 7, "tips": ["tip3", "tip4"] });
  });
});
