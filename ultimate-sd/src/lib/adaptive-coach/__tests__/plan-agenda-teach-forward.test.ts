// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  AgendaOutputSchema,
  TeachForwardSchema,
  fallbackAgenda,
  invokePlanAgenda,
  invokeTeachForward,
} from '@/lib/adaptive-coach/skills/invoke';
import type { CoachStage } from '@/lib/adaptive-coach/tools/stage-rails';
import type { LearnerProfile } from '@/lib/adaptive-coach/types';

const profile: LearnerProfile = {
  userId: 'user-1',
  level: 'sde1',
  companies: [],
  intent: 'interview',
  competencies: [],
  memoryNotes: [],
};

const stage: CoachStage = {
  id: 'requirements-0',
  phaseKey: 'requirements',
  phase: 'Requirements',
  title: 'Functional Requirements',
  prompt: 'List the core features from entry to exit.',
  budgetSec: 360,
};

describe('AgendaOutputSchema', () => {
  it('accepts 1–3 valid moves', () => {
    const result = AgendaOutputSchema.safeParse({
      moves: [
        { kind: 'ask', prompt: 'What are the core user flows?', skillFocus: ['api-design'] },
        { kind: 'probe', prompt: 'How would you handle peak load?', skillFocus: ['scalability'] },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty or oversized move lists', () => {
    expect(AgendaOutputSchema.safeParse({ moves: [] }).success).toBe(false);
    expect(
      AgendaOutputSchema.safeParse({
        moves: [
          { kind: 'ask', prompt: 'a', skillFocus: [] },
          { kind: 'ask', prompt: 'b', skillFocus: [] },
          { kind: 'ask', prompt: 'c', skillFocus: [] },
          { kind: 'ask', prompt: 'd', skillFocus: [] },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects invalid move kinds or empty prompts', () => {
    expect(
      AgendaOutputSchema.safeParse({
        moves: [{ kind: 'invalid', prompt: 'test', skillFocus: [] }],
      }).success,
    ).toBe(false);
    expect(
      AgendaOutputSchema.safeParse({
        moves: [{ kind: 'ask', prompt: '', skillFocus: [] }],
      }).success,
    ).toBe(false);
  });
});

describe('TeachForwardSchema', () => {
  it('accepts a valid tip payload', () => {
    const result = TeachForwardSchema.safeParse({
      tip: 'Consider how operators monitor occupancy in real time.',
      skillFocus: ['observability'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty tip', () => {
    expect(
      TeachForwardSchema.safeParse({ tip: '', skillFocus: [] }).success,
    ).toBe(false);
  });
});

describe('fallbackAgenda', () => {
  it('returns a single rail ask from the stage prompt', () => {
    const moves = fallbackAgenda(stage);

    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({
      id: 'requirements-0-rail-0',
      kind: 'ask',
      prompt: stage.prompt,
      skillFocus: [],
      source: 'rail',
    });
  });
});

describe('invokePlanAgenda', () => {
  it('parses JSON from a mock LLM and maps to AgendaMove[]', async () => {
    const llmOutput = {
      moves: [
        { kind: 'ask', prompt: 'Walk through the entry flow.', skillFocus: ['api-design'] },
        { kind: 'teach', prompt: 'Hint: consider payment retries.', skillFocus: ['consistency'] },
      ],
    };

    const llm = {
      invoke: vi.fn().mockResolvedValue({ content: JSON.stringify(llmOutput) }),
    };

    const result = await invokePlanAgenda({
      llm: llm as never,
      profile,
      problemTitle: 'Parking Lot System',
      stage,
      gold: ['Expert FR: admit vehicle, assign spot'],
    });

    expect(result).toEqual([
      {
        id: 'requirements-0-plan-0',
        kind: 'ask',
        prompt: 'Walk through the entry flow.',
        skillFocus: ['api-design'],
        source: 'planner',
      },
      {
        id: 'requirements-0-plan-1',
        kind: 'teach',
        prompt: 'Hint: consider payment retries.',
        skillFocus: ['consistency'],
        source: 'planner',
      },
    ]);
    expect(llm.invoke).toHaveBeenCalledOnce();
    const [messages] = llm.invoke.mock.calls[0];
    expect(messages).toHaveLength(2);
    expect(String(messages[0].content)).toMatch(/senior staff interviewer/i);
    expect(String(messages[1].content)).toMatch(/## Session/);
    expect(String(messages[1].content)).toMatch(/Competency signals/);
    expect(String(messages[1].content)).toMatch(/Memory notes/);
    expect(String(messages[1].content)).not.toMatch(/senior staff interviewer/i);
  });

  it('falls back to rail ask when the LLM throws', async () => {
    const llm = {
      invoke: vi.fn().mockRejectedValue(new Error('LLM unavailable')),
    };

    const result = await invokePlanAgenda({
      llm: llm as never,
      profile,
      problemTitle: 'Parking Lot System',
      stage,
      gold: [],
    });

    expect(result).toEqual(fallbackAgenda(stage));
  });

  it('falls back to rail ask when LLM returns malformed JSON after retry', async () => {
    const llm = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: 'Here is my plan in prose.' })
        .mockResolvedValueOnce({ content: 'Still not JSON.' }),
    };

    const result = await invokePlanAgenda({
      llm: llm as never,
      profile,
      problemTitle: 'Parking Lot System',
      stage,
      gold: [],
    });

    expect(result).toEqual(fallbackAgenda(stage));
    expect(llm.invoke).toHaveBeenCalledTimes(2);
  });
});

describe('invokeTeachForward', () => {
  it('parses JSON from a mock LLM and validates against the schema', async () => {
    const valid = {
      tip: 'For parking systems, call out how operators detect full lots without manual checks.',
      skillFocus: ['observability', 'api-design'],
    };

    const llm = {
      invoke: vi.fn().mockResolvedValue({ content: JSON.stringify(valid) }),
    };

    const result = await invokeTeachForward({
      llm: llm as never,
      profile,
      problemTitle: 'Parking Lot System',
      stage,
      userAnswer: 'Users park and pay.',
      gold: ['Expert: occupancy sensors feed a dashboard'],
      gateReason: 'Max attempts reached with score below bar',
    });

    expect(result).toEqual(valid);
    expect(llm.invoke).toHaveBeenCalledOnce();
  });

  it('retries once when the first LLM response is malformed JSON', async () => {
    const valid = {
      tip: 'Mention degraded mode when the payment gateway is down.',
      skillFocus: ['consistency'],
    };

    const llm = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: 'Let me explain the full architecture...' })
        .mockResolvedValueOnce({ content: JSON.stringify(valid) }),
    };

    const result = await invokeTeachForward({
      llm: llm as never,
      profile,
      problemTitle: 'Parking Lot System',
      stage,
      userAnswer: 'Basic parking only.',
      gold: [],
      gateReason: 'Time budget exceeded',
    });

    expect(result).toEqual(valid);
    expect(llm.invoke).toHaveBeenCalledTimes(2);
  });
});
